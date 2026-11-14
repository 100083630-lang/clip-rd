import express from "express";
import cors from "cors";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, renameSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PORT=3847;
const app=express();
app.use(cors());
app.use(express.json({limit:"1mb"}));

const PUBLIC=path.join(__dirname,"public");
const CLIPS=path.join(__dirname,"clips");
const LIVE=path.join(__dirname,"live-recordings");
const TMP=path.join(__dirname,"tmp");
for(const dir of [CLIPS,LIVE,TMP]) mkdirSync(dir,{recursive:true});

app.use(express.static(PUBLIC));
app.use("/clips",express.static(CLIPS));

const state={
  job:{active:false,stage:"En espera",percent:0,message:"",error:null},
  live:{active:false,sourceUrl:"",startedAt:null,clipLength:45,child:null,timer:null,recording:"",recordingTemplate:"",processed:0,lastError:null,percent:0,message:"Detenido",stopping:false}
};

function run(bin,args,{cwd=__dirname,timeout=0,onStderr,onStdout}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{cwd,windowsHide:true});
    let out="",err="";
    child.stdout?.on("data",d=>{const t=String(d);out+=t;onStdout?.(t)});
    child.stderr?.on("data",d=>{const t=String(d);err+=t;onStderr?.(t)});
    const timer=timeout?setTimeout(()=>{child.kill("SIGKILL");reject(new Error("Tiempo agotado"))},timeout):null;
    child.on("error",e=>{if(timer)clearTimeout(timer);reject(e)});
    child.on("close",code=>{if(timer)clearTimeout(timer);code===0?resolve({out,err}):reject(new Error(err||bin+" terminó con código "+code))});
  });
}
function safeName(s){return String(s||"clip").replace(/[^a-z0-9_-]/gi,"_").slice(0,60)}
function listClips(){
  return readdirSync(CLIPS).filter(f=>f.toLowerCase().endsWith(".mp4")).map(f=>{
    const st=statSync(path.join(CLIPS,f));
    return {id:f,url:"/clips/"+encodeURIComponent(f),title:f.replace(/\.mp4$/i,"").replace(/[_-]+/g," "),createdAt:st.mtime.toISOString(),size:st.size};
  }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
function checkTools(){
  const y=spawnSync("yt-dlp",["--version"],{windowsHide:true,encoding:"utf8"});
  const f=spawnSync("ffmpeg",["-version"],{windowsHide:true,encoding:"utf8"});
  return {
    ytDlp:y.status===0,
    ytDlpVersion:String(y.stdout||"").trim()||null,
    ffmpeg:f.status===0,
    node:process.version
  };
}
function parsePercent(text){
  const m=text.match(/(?:\[download\]\s*)?(\d{1,3}(?:\.\d+)?)%/);
  return m?Math.min(100,Math.max(0,Number(m[1]))):null;
}
const YTDLP_JS_ARGS=["--no-js-runtimes","--js-runtimes","node","--remote-components","ejs:npm"];

async function download(source,outFile){
  const formats=["bestvideo*+bestaudio/best","bv*+ba/best","best"];
  let last;
  for(const format of formats){
    try{
      state.job.message="Descargando video…"; state.job.percent=0;
      await run("yt-dlp",["--no-playlist",...YTDLP_JS_ARGS,"-f",format,"--merge-output-format","mp4","--newline","-o",outFile,source],{
        onStderr:t=>{const p=parsePercent(t);if(p!==null){state.job.percent=p;state.job.message="Descargando video: "+p+"%"}}
      });
      state.job.percent=100; return;
    }catch(e){last=e}
  }
  throw last||new Error("No se pudo descargar el video");
}
function findLiveRecording(s){
  return s.recording&&existsSync(s.recording)?s.recording:null;
}
function isUsable(file,min=50000){try{return existsSync(file)&&statSync(file).size>min}catch{return false}}
function durationOf(file){
  try{
    const r=spawnSync("ffprobe",["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",file],{windowsHide:true,encoding:"utf8"});
    const n=Number(String(r.stdout||"").trim()); return Number.isFinite(n)?n:0;
  }catch{return 0}
}

app.get("/health",(req,res)=>res.json({ok:true,service:"CLIPRD 3.0 Local Engine",version:"3.1.0",tools:checkTools()}));
app.get("/api/clips",(req,res)=>res.json({clips:listClips()}));
app.get("/api/progress",(req,res)=>res.json(state.job));

app.post("/api/auto-clips",async(req,res)=>{
  console.log("LLEGÓ PETICIÓN DE CLIP",new Date().toLocaleTimeString());
  const {sourceUrl,clipLength=45,maxClips=3}=req.body||{};
  if(!sourceUrl) return res.status(400).json({error:"Falta sourceUrl"});
  if(state.job.active) return res.status(409).json({error:"Ya hay una descarga en proceso"});
  const length=Math.max(5,Math.min(300,Number(clipLength)||45));
  const count=Math.max(1,Math.min(20,Number(maxClips)||3));
  const source=path.join(TMP,"source-"+Date.now()+".mp4");
  state.job={active:true,stage:"download",percent:0,message:"Preparando descarga…",error:null};
  try{
    if(/^https?:\/\//i.test(sourceUrl)) await download(sourceUrl,source);
    else if(existsSync(sourceUrl)){state.job.message="Preparando archivo local…";state.job.percent=100;await run("ffmpeg",["-y","-i",sourceUrl,"-c","copy",source]);}
    else throw new Error("Ruta o URL inválida");
    const clips=[];
    for(let i=0;i<count;i++){
      const name=safeName("clip_"+Date.now()+"_"+(i+1))+".mp4";
      const target=path.join(CLIPS,name);
      state.job.stage="clip";state.job.message="Generando clip "+(i+1)+" de "+count+"…";
      state.job.percent=Math.max(1,Math.round((i/count)*100));
      await run("ffmpeg",["-y","-ss",String(i*length),"-i",source,"-t",String(length),"-map","0:v:0","-map","0:a?","-c:v","libx264","-c:a","aac","-movflags","+faststart",target]);
      clips.push({id:name,url:"/clips/"+encodeURIComponent(name),title:"Clip "+(i+1),start:i*length,end:(i+1)*length,duration:length});
    }
    state.job.percent=100;state.job.stage="done";state.job.message="Clips listos";
    res.json({ok:true,clips});
  }catch(e){
    console.error("AUTO CLIP ERROR:",e.message);
    state.job.error=e.message;state.job.stage="error";state.job.message="Error";
    res.status(500).json({error:e.message});
  }finally{
    state.job.active=false;
    if(existsSync(source)) try{unlinkSync(source)}catch{}
  }
});

async function makeLiveClip({force=false}={}){
  const s=state.live;
  const recording=findLiveRecording(s);
  if(!recording){s.message="Esperando el primer segmento del LIVE…";return false;}
  const size=statSync(recording).size;
  if(size<750000){s.message="El LIVE está acumulando los primeros segundos…";return false;}

  // No cortamos por tamaño: esperamos duración real. Esto evita leer un .part de 0.02 s.
  const available=durationOf(recording);
  const start=s.processed*s.clipLength;
  const remaining=available-start;
  const minimum=force?5:s.clipLength;
  if(remaining<minimum){
    s.message="Acumulando LIVE… "+Math.max(0,Math.floor(remaining))+" s disponibles para el siguiente clip";
    return false;
  }

  const length=force?Math.min(s.clipLength,Math.floor(remaining)):s.clipLength;
  const name=safeName("live_"+Date.now()+"_"+(s.processed+1))+".mp4";
  const target=path.join(CLIPS,name);
  try{
    s.message="Creando clip LIVE "+(s.processed+1)+"…";
    await run("ffmpeg",[
      "-y","-analyzeduration","20M","-probesize","20M",
      "-ss",String(start),"-i",recording,"-t",String(length),
      "-map","0:v:0?","-map","0:a:0?",
      "-c:v","libx264","-c:a","aac","-movflags","+faststart",target
    ],{timeout:120000});
    if(isUsable(target)){
      s.processed++;
      s.message="LIVE: "+s.processed+" clip(s) creados";
      console.log("LIVE CLIP CREADO:",name);
      return true;
    }
    if(existsSync(target)) unlinkSync(target);
  }catch(e){
    if(existsSync(target)) try{unlinkSync(target)}catch{}
    s.lastError=e.message.slice(-1000);
    s.message=force?"No había suficiente LIVE estable para crear el último clip":"Esperando más datos estables del LIVE…";
    if(force) console.log("LIVE CLIP AÚN NO DISPONIBLE:",e.message);
  }
  return false;
}

function launchLiveDownloader(s, attempt=0){
  // YouTube cambió la extracción de formatos. No dependemos de Deno, que en esta
  // máquina estaba agotando la conexión al player JS: usamos el Node que ya ejecuta
  // CLIPRD y permitimos a yt-dlp obtener/actualizar los componentes EJS por npm.
  // Después probamos clientes alternativos que suelen exponer formatos de LIVE.
  const profiles=[
    {name:"Node + extractor predeterminado", format:"bestvideo*+bestaudio/best", extractor:null},
    {name:"Default sin web_embedded", format:"bestvideo*+bestaudio/best", extractor:"youtube:player_client=default,-web_embedded"},
    {name:"Android", format:"bestvideo*+bestaudio/best", extractor:"youtube:player_client=android"},
    {name:"VisionOS", format:"bestvideo*+bestaudio/best", extractor:"youtube:player_client=visionos"}
  ];
  const p=profiles[Math.min(attempt,profiles.length-1)];
  s.message="Conectando al LIVE ("+p.name+")…";
  console.log("LIVE yt-dlp intento",attempt+1,"/",profiles.length,"-",p.name);

  const args=[
    "--ignore-config","--no-playlist","--no-part","--hls-use-mpegts",
    ...YTDLP_JS_ARGS,
    "--newline","-f",p.format,
    ...(p.extractor?["--extractor-args",p.extractor]:[]),
    "-o",s.recording,s.sourceUrl
  ];
  s.child=spawn("yt-dlp",args,{windowsHide:true});
  let output="";
  const handle=t=>{
    output+=t;
    const pct=parsePercent(t);
    if(pct!==null){s.percent=pct;s.message="Recibiendo LIVE: "+pct+"%"}
    if(/ERROR:|Requested format is not available|No video formats found|n challenge solving failed/i.test(t)){
      s.lastError=t.slice(-1000);
      console.error("LIVE yt-dlp:",t.trim());
    }
  };
  s.child.stdout?.on("data",d=>handle(String(d)));
  s.child.stderr?.on("data",d=>handle(String(d)));
  s.child.on("error",e=>{s.lastError=e.message;s.message="Error al iniciar yt-dlp"});
  s.child.on("close",code=>{
    if(!s.active||s.stopping) return;
    const failed=code!==0 || /Requested format is not available|No video formats found|n challenge solving failed|ERROR:/i.test(output);
    if(failed && attempt<profiles.length-1){
      console.log("LIVE: intento",attempt+1,"falló. Probando siguiente extractor...");
      s.lastError=null;
      setTimeout(()=>launchLiveDownloader(s,attempt+1),1200);
      return;
    }
    if(code!==0){
      s.lastError=(output.slice(-1500)||"yt-dlp terminó con código "+code);
      s.message="No se pudo obtener ningún formato del LIVE.";
      console.error("LIVE FALLÓ DESPUÉS DE TODOS LOS INTENTOS. Revisa /health y la versión de yt-dlp.");
    }
  });
}

app.post("/live/start",(req,res)=>{
  if(state.live.active) return res.json({active:true,message:"Live Radar ya está activo"});
  const {sourceUrl,clipLength=45}=req.body||{};
  if(!sourceUrl) return res.status(400).json({error:"Falta sourceUrl"});

  const s=state.live;
  s.active=true;s.stopping=false;s.sourceUrl=sourceUrl;s.startedAt=new Date().toISOString();
  s.clipLength=Math.max(10,Number(clipLength)||45);s.processed=0;s.lastError=null;s.percent=0;
  s.recording=path.join(LIVE,"live-"+Date.now()+".ts");
  s.recordingTemplate=path.basename(s.recording);s.message="Conectando al LIVE…";

  launchLiveDownloader(s,0);
  setTimeout(()=>makeLiveClip(),8000);
  s.timer=setInterval(()=>makeLiveClip(),5000);
  console.log("LIVE INICIADO:",sourceUrl);
  res.json({active:true,message:"🟢 Live conectado. Cortes automáticos cada "+s.clipLength+" segundos"});
});
app.get("/live/status",(req,res)=>res.json({
  active:state.live.active,sourceUrl:state.live.sourceUrl,startedAt:state.live.startedAt,
  clipLength:state.live.clipLength,processedSegments:state.live.processed,lastError:state.live.lastError,
  percent:state.live.percent,message:state.live.message,recording:state.live.recording||null,
  bytesDownloaded:state.live.recording&&existsSync(state.live.recording)?statSync(state.live.recording).size:0,
  secondsAvailable:state.live.recording&&existsSync(state.live.recording)?Math.floor(durationOf(state.live.recording)):0
}));

app.post("/live/stop",async(req,res)=>{
  const s=state.live;
  if(!s.active) return res.json({active:false,message:"Live ya estaba detenido"});
  s.stopping=true;s.message="Deteniendo LIVE…";
  if(s.timer) clearInterval(s.timer);
  console.log("DETENIENDO LIVE…");
  if(process.platform==="win32"&&s.child?.pid) spawnSync("taskkill",["/PID",String(s.child.pid),"/T","/F"],{windowsHide:true});
  else s.child?.kill("SIGTERM");
  s.child=null;
  await new Promise(r=>setTimeout(r,1500));
  // Ya con el proceso detenido el archivo queda libre; intentamos guardar el último segmento disponible.
  await makeLiveClip({force:true});
  s.active=false;s.stopping=false;s.timer=null;s.percent=100;s.message="🛑 Live detenido";
  res.json({active:false,message:"🛑 Live detenido. Último segmento disponible procesado."});
});

app.get("/*splat",(req,res)=>res.sendFile(path.join(PUBLIC,"index.html")));
app.listen(PORT,"127.0.0.1",()=>console.log("CLIPRD 3.0 listo en http://127.0.0.1:"+PORT));
