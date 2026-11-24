import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function registerLiveRoutes(app, deps) {
  const { dirs, ytBaseArgs, ytProfiles, run, addClip, makeThumbs, viralMeta, publicClip, id, now } = deps;
  const state = {
    active:false, status:"idle", sourceUrl:null, videoId:null, title:"LIVE",
    startedAt:null, process:null, timer:null, clips:0, bytes:0, log:[],
    segmentDir:null, lastCandidateAt:0, busy:false, cooldownUntil:0, profile:null
  };

  const log = message => {
    state.log.push({time:now(), message:String(message).slice(0,1200)});
    if(state.log.length>150) state.log.shift();
  };
  const youtubeId = url => {
    try {
      const u = new URL(url);
      if(u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      if(u.pathname.startsWith("/live/") || u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
      return u.searchParams.get("v");
    } catch { return null; }
  };
  const normalizeUrl = url => {
    try {
      const u = new URL(url);
      if(u.hostname.includes("youtu.be")) return "https://www.youtube.com/watch?v="+u.pathname.slice(1);
      if(u.pathname.startsWith("/live/") || u.pathname.startsWith("/shorts/"))
        return "https://www.youtube.com/watch?v="+u.pathname.split("/")[2];
    } catch {}
    return url;
  };
  const safeName = value => String(value).replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,70);
  const listSegments = () => {
    if(!state.segmentDir || !fs.existsSync(state.segmentDir)) return [];
    return fs.readdirSync(state.segmentDir)
      .filter(name=>/^seg-\d+\.ts$/.test(name))
      .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]))
      .map(name=>path.join(state.segmentDir,name));
  };
  const probe = async url => {
    let last;
    for(const profile of ytProfiles) {
      try {
        log("Verificando acceso LIVE · "+profile.name);
        const result = await run("yt-dlp",[
          ...ytBaseArgs(),...profile.args,"--skip-download","--dump-single-json",url
        ],line=>{ if(line.trim()) log(line.trim()); },{timeout:60000});
        const meta=JSON.parse(result.stdout.trim().split(/\r?\n/).filter(Boolean).pop());
        if(meta?.id) return {profile,meta};
      } catch(error) { last=error; log("Perfil "+profile.name+": "+error.message.slice(0,250)); }
    }
    throw new Error("No se pudo validar el acceso al LIVE. "+(last?.message||""));
  };
  const getStreamUrl = async (url, profile) => {
    const result=await run("yt-dlp",[
      ...ytBaseArgs(),...profile.args,"--get-url","-f","best",url
    ],line=>{ if(line.trim()) log(line.trim().slice(0,400)); },{timeout:60000});
    const urls=result.stdout.trim().split(/\r?\n/).map(x=>x.trim()).filter(x=>/^https?:\/\//i.test(x));
    if(!urls.length) throw new Error("YouTube no entregó una URL de video reproducible.");
    if(urls.length>1) log("YouTube entregó varias pistas; se utilizará el formato combinado disponible.");
    return urls[0];
  };
  const analyzeSegment = async file => {
    const result=await run("ffmpeg",[
      "-hide_banner","-nostats","-i",file,
      "-af","volumedetect,silencedetect=noise=-35dB:d=0.35",
      "-f","null","-"
    ],()=>{},{timeout:25000});
    const raw=result.stderr||"";
    const mean=Number((raw.match(/mean_volume:\s*(-?[\d.]+)/)||[])[1]);
    const peak=Number((raw.match(/max_volume:\s*(-?[\d.]+)/)||[])[1]);
    const silence=(raw.match(/silence_start/g)||[]).length;
    const energy=Number.isFinite(mean)?Math.max(0,Math.min(1,(mean+45)/40)):0;
    const peakEnergy=Number.isFinite(peak)?Math.max(0,Math.min(1,(peak+35)/35)):0;
    return {mean,peak,silence,score:Math.round(energy*45+peakEnergy*45+(silence===0?10:0))};
  };
  const pruneSegments = segments => {
    // Keep a short rolling buffer; never touch the newest 18 closed segments.
    for(const old of segments.slice(0,Math.max(0,segments.length-18))) {
      try { fs.unlinkSync(old); } catch {}
    }
  };
  const createCandidate = async () => {
    if(!state.active || state.busy || Date.now()<state.cooldownUntil) return;
    const segments=listSegments();
    state.bytes=segments.reduce((sum,file)=>sum+(fs.existsSync(file)?fs.statSync(file).size:0),0);
    pruneSegments(segments);
    // A candidate is assembled only from closed, complete MPEG-TS segments.
    if(segments.length<9) return;
    const latest=segments[segments.length-1];
    const latestMtime=fs.statSync(latest).mtimeMs;
    if(Date.now()-latestMtime<1500 || latestMtime<=state.lastCandidateAt) return;
    state.lastCandidateAt=latestMtime;
    state.busy=true;
    state.status="analizando";
    try {
      const windowSegments=segments.slice(-9);
      const measures=[];
      for(const segment of windowSegments.slice(-4)) {
        try { measures.push(await analyzeSegment(segment)); } catch {}
      }
      if(!measures.length) throw new Error("No se pudo analizar el audio de los segmentos recientes.");
      const best=measures.reduce((a,b)=>b.score>a.score?b:a,measures[0]);
      const avg=measures.reduce((n,x)=>n+x.score,0)/measures.length;
      const acousticScore=Math.min(99,Math.round(best.score*.7+avg*.3));
      log("Evaluación acústica · "+acousticScore+"/100 · pico "+(Number.isFinite(best.peak)?best.peak+" dB":"sin lectura"));
      if(acousticScore<32) {
        state.status="recording";
        log("Momento descartado: audio demasiado bajo o sin actividad.");
        return;
      }
      const base="live-"+Date.now()+"-"+(state.clips+1);
      const concatFile=path.join(state.segmentDir,base+".txt");
      const wavFile=path.join(state.segmentDir,base+".wav");
      const output=path.join(dirs.clips,base+".mp4");
      const selected=windowSegments.slice(-9);
      fs.writeFileSync(concatFile,selected.map(file=>"file '"+file.split(path.sep).join("/").replace(/'/g,"'\\''")+"'").join("\n"),"utf8");
      log("🧠 Transcribiendo ventana LIVE para detectar contexto, no solo volumen.");
      await run("ffmpeg",["-y","-hide_banner","-loglevel","error","-f","concat","-safe","0","-i",concatFile,"-vn","-ac","1","-ar","16000","-c:a","pcm_s16le",wavFile],()=>{},{timeout:90000});
      const python=process.env.CLIPRD_PYTHON|| (process.platform==="win32"?"python":"python3");
      const transcriptResult=await run(python,[path.join(path.dirname(new URL(import.meta.url).pathname),"transcribir_live.py"),wavFile],()=>{},{timeout:12*60*1000});
      const transcript=JSON.parse(transcriptResult.stdout.trim().split(/\r?\n/).filter(Boolean).pop());
      const words=(transcript.text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      const groups=[
        {name:"confrontación o discusión",terms:["pelea","callate","cállate","tu no sabes","mentira","mentiroso","ladron","ladron","respeta","problema","amenaza","vete de aqui","vete de ahi","te voy a","no me faltes","no te metas","que tu dices","que dijiste","diablo","carajo","maldito","insulto"]},
        {name:"reacción o sorpresa",terms:["no puede ser","que fuerte","increible","increíble","wao","wow","dios mio","mi madre","en serio","no lo creo","que paso","que paso ahi","asombroso","sorprendido"]},
        {name:"chisme o revelación",terms:["te voy a contar","nadie sabe","la verdad es","te lo dije","secreto","confesion","confesión","revelar","descubri","descubrí","me entere","me enteré","supuestamente","resulta que"]},
        {name:"humor o momento viral",terms:["risas","jajaja","no aguanto","me muero","que risa","eso da risa","broma","relajo","payaso","loco"]}
      ];
      const matched=groups.map(group=>({...group,hits:group.terms.filter(term=>words.includes(term.normalize("NFD").replace(/[\u0300-\u036f]/g,"")))})).filter(group=>group.hits.length);
      const semanticScore=Math.min(100,matched.reduce((sum,group)=>sum+Math.min(28,group.hits.length*14),0)+(words.includes("!")?8:0));
      const score=Math.min(99,Math.round(acousticScore*.35+semanticScore*.65));
      const motive=matched.length?matched.map(group=>group.name).join(", "):"conversación detectada por transcripción";
      log("Transcripción ES · "+(transcript.text||"sin texto reconocido").slice(0,450));
      log("Contexto detectado · "+motive+" · semántica "+semanticScore+"/100 · total "+score+"/100");
      if(!transcript.text || score<48) {
        fs.rmSync(concatFile,{force:true}); fs.rmSync(wavFile,{force:true});
        state.status="recording";
        log("Momento descartado: no alcanzó el umbral de contexto viral.");
        return;
      }
      log("🔥 Momento contextual seleccionado · preparando clip con audio y video.");
      await run("ffmpeg",[
        "-y","-f","concat","-safe","0","-i",concatFile,
        "-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast",
        "-pix_fmt","yuv420p","-c:a","aac","-b:a","128k","-movflags","+faststart",
        output
      ],line=>{if(line.trim()) log(line.trim());},{timeout:180000});
      fs.rmSync(concatFile,{force:true}); fs.rmSync(wavFile,{force:true});
      if(!fs.existsSync(output) || fs.statSync(output).size<250000)
        throw new Error("El archivo generado no superó la validación de tamaño.");
      const thumbs=await makeThumbs(output,base,0,45);
      const meta=viralMeta(score,motive+" · "+(transcript.text||"").slice(0,180),state.title,new Date().toISOString().slice(11,19));
      addClip(publicClip(path.basename(output),meta.titulo_viral,0,45,thumbs,{...meta,type:"LIVE",source:"LIVE"}));
      state.clips++;
      state.cooldownUntil=Date.now()+60000;
      state.status="recording";
      log("✅ Clip LIVE validado y guardado en la Biblioteca.");
    } catch(error) {
      state.status="recording";
      log("Error procesando momento: "+error.message);
    } finally {
      state.busy=false;
    }
  };
  const cleanup = async () => {
    if(state.timer) clearInterval(state.timer);
    state.timer=null;
    const proc=state.process;
    state.process=null;
    if(proc && proc.exitCode===null) {
      try { proc.kill("SIGTERM"); } catch {}
      await Promise.race([new Promise(resolve=>proc.once("close",resolve)),sleep(5000)]);
      if(proc.exitCode===null) try { proc.kill("SIGKILL"); } catch {}
    }
    state.active=false;
  };

  app.get("/live/status",(req,res)=>res.json({
    active:state.active,sourceUrl:state.sourceUrl,videoId:state.videoId,
    startedAt:state.startedAt,status:state.status,clips:state.clips,bytes:state.bytes,
    elapsed:state.startedAt?Math.floor((Date.now()-new Date(state.startedAt))/1000):0,
    log:state.log.slice(-60)
  }));

  app.post("/live/start",async(req,res)=>{
    const {sourceUrl}=req.body||{};
    if(!sourceUrl) return res.status(400).json({error:"sourceUrl requerido"});
    if(state.active) return res.status(409).json({error:"Ya hay un LIVE activo."});
    state.active=true; state.status="starting"; state.sourceUrl=normalizeUrl(sourceUrl);
    state.videoId=youtubeId(sourceUrl); state.startedAt=now(); state.clips=0; state.bytes=0;
    state.log=[]; state.lastCandidateAt=0; state.busy=false; state.cooldownUntil=0;
    const folder=path.join(dirs.live,"session-"+Date.now());
    fs.mkdirSync(folder,{recursive:true}); state.segmentDir=folder;
    log("Iniciando motor LIVE nuevo · captura por segmentos cerrados.");
    res.status(202).json({active:true,message:"LIVE conectado: preparando captura y análisis automático."});
    try {
      const access=await probe(state.sourceUrl);
      if(!state.active) return;
      state.title=access.meta.title||"LIVE";
      const streamUrl=await getStreamUrl(state.sourceUrl,access.profile);
      if(!state.active) return;
      const segmentPattern=path.join(folder,"seg-%06d.ts");
      const args=[
        "-hide_banner","-loglevel","warning","-i",streamUrl,
        "-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p","-c:a","aac","-b:a","128k","-force_key_frames","expr:gte(t,n_forced*5)",
        "-f","segment","-segment_format","mpegts","-segment_time","5",
        "-reset_timestamps","1","-segment_start_number","0",segmentPattern
      ];
      const proc=spawn("ffmpeg",args,{windowsHide:true,stdio:["ignore","ignore","pipe"]});
      state.process=proc; state.status="recording";
      proc.stderr.on("data",chunk=>log(String(chunk).trim()));
      proc.on("error",error=>{if(state.active){state.status="error";log("FFmpeg: "+error.message);}});
      proc.on("close",code=>{
        if(state.active) {
          state.status=code===0?"stopped":"error";
          state.active=false;
          if(state.timer) clearInterval(state.timer);
          state.timer=null;
          log("Captura LIVE finalizada · código "+code);
        }
      });
      log("🔴 Captura de audio y video activa · "+state.title);
      state.timer=setInterval(()=>createCandidate().catch(error=>log(error.message)),10000);
    } catch(error) {
      state.status="error"; log("No se pudo iniciar LIVE: "+error.message);
      await cleanup();
    }
  });

  app.post("/live/stop",async(req,res)=>{
    if(!state.active) return res.json({active:false,status:"already stopped"});
    state.status="stopping"; log("Deteniendo motor LIVE…");
    await cleanup();
    state.status="stopped"; log("LIVE detenido correctamente.");
    res.json({active:false,status:"stopped"});
  });
}
