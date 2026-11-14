import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const app=express();
const PORT=3847;
const dirs={
  clips:path.join(__dirname,"clips"),
  downloads:path.join(__dirname,"downloads"),
  thumbs:path.join(__dirname,"thumbs"),
  live:path.join(__dirname,"live-recordings")
};
Object.values(dirs).forEach(d=>fs.mkdirSync(d,{recursive:true}));

app.use(cors());
app.use(express.json({limit:"2mb"}));
app.use("/clips",express.static(dirs.clips));
app.use("/thumbs",express.static(dirs.thumbs));
app.use(express.static(path.join(__dirname,"public")));

const jobs=new Map();
let library=[];
const libraryFile=path.join(__dirname,"library.json");
try{if(fs.existsSync(libraryFile))library=JSON.parse(fs.readFileSync(libraryFile,"utf8"));}catch{library=[];}
function saveLibrary(){try{fs.writeFileSync(libraryFile,JSON.stringify(library,null,2));}catch{}}

let live={active:false,sourceUrl:null,startedAt:null,process:null,recording:null,timer:null,clips:0,status:"idle",log:[],bytes:0,lastSize:0,lastAnalyzed:0,cooldownUntil:0,videoId:null,title:"LIVE"};

function id(){return Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8)}
function now(){return new Date().toISOString()}
function addLog(target,message){target.log.push({time:now(),message});if(target.log.length>150)target.log.shift();}
function command(name,args,options={}){return spawn(name,args,{windowsHide:true,...options});}
function killTree(p){try{if(p?.pid&&process.platform==="win32")command("taskkill",["/PID",String(p.pid),"/T","/F"]);else p?.kill("SIGKILL");}catch{}}
function normalizeYoutube(url){
  try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return "https://www.youtube.com/watch?v="+u.pathname.slice(1);
    if(u.pathname.startsWith("/shorts/")||u.pathname.startsWith("/live/"))return "https://www.youtube.com/watch?v="+u.pathname.split("/")[2];
  }catch{} return url;
}
function youtubeId(url){try{const u=new URL(normalizeYoutube(url));return u.searchParams.get("v")||null;}catch{return null;}}
function run(cmd,args,onLine,{timeout=0}={}){
  return new Promise((resolve,reject)=>{
    const p=command(cmd,args);let stdout="",stderr="",done=false;
    const finish=(err,val)=>{if(done)return;done=true;if(timer)clearTimeout(timer);err?reject(err):resolve(val);};
    const timer=timeout?setTimeout(()=>{killTree(p);finish(new Error(cmd+" agotó el tiempo"));},timeout):null;
    p.stdout.on("data",d=>{stdout+=d;onLine?.(String(d));});
    p.stderr.on("data",d=>{stderr+=d;onLine?.(String(d));});
    p.on("error",finish);
    p.on("close",code=>code===0?finish(null,{stdout,stderr}):finish(new Error((stderr||stdout||cmd+" exit "+code).slice(-6000))));
  });
}
function ytBaseArgs(){
  const args=["--ignore-config","--no-playlist","--newline","--socket-timeout","20","--retries","3","--fragment-retries","3","--extractor-retries","3"];
  const cookies=path.join(__dirname,"cookies.txt");
  if(fs.existsSync(cookies))args.push("--cookies",cookies);
  args.push("--extractor-args","youtube:player_client=web_safari");
  args.push("--extractor-args","youtube:po_token=web_safari.gvs+auto");
  return args;
}
const ytProfiles=[{name:"Safari",args:[]},{name:"Web",args:["--extractor-args","youtube:player_client=web"]},{name:"Android",args:["--extractor-args","youtube:player_client=android"]}];

async function probeYoutube(url,target){
  let lastError;
  for(let i=0;i<ytProfiles.length;i++){
    const profile=ytProfiles[i];
    target.message="Comprobando YouTube · "+profile.name;
    addLog(target,"YouTube "+(i+1)+"/"+ytProfiles.length+" · "+profile.name);
    try{
      const r=await run("yt-dlp",[...ytBaseArgs(),...profile.args,"--skip-download","--dump-single-json",url],l=>addLog(target,l.trim()),{timeout:60000});
      const meta=JSON.parse(r.stdout.trim().split(/\r?\n/).filter(Boolean).pop());
      if(meta?.id)return {profile,meta};
    }catch(e){lastError=e;addLog(target,"Perfil falló: "+profile.name+" · "+e.message.slice(0,250));}
  }
  throw new Error("YouTube no entregó un formato utilizable para esta sesión."+(lastError?" "+lastError.message.slice(0,180):""));
}
async function downloadYoutube(url,output,target){
  const access=await probeYoutube(url,target);
  target.message="Descargando con "+access.profile.name;
  const args=[...ytBaseArgs(),...access.profile.args,"--merge-output-format","mp4","-o",output,url];
  await run("yt-dlp",args,line=>{
    addLog(target,line.trim());
    const m=line.match(/(\d{1,3}(?:\.\d+)?)%/);
    if(m){target.progress=Math.min(72,5+Number(m[1])*.67);target.message="Descargando "+m[1]+"%";}
  },{timeout:15*60*1000});
  return access;
}
async function ffDuration(file){
  const r=await run("ffprobe",["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",file]);
  return Number(r.stdout.trim())||0;
}
async function makeThumbs(input,base,start,duration,text=""){
  const points=[0.1,0.5,0.85],out=[];
  for(let i=0;i<points.length;i++){
    const name=base+"-"+(i+1)+".jpg",dest=path.join(dirs.thumbs,name),t=Math.max(0,start+duration*points[i]);
    try{
      await run("ffmpeg",["-y","-ss",String(t),"-i",input,"-frames:v","1","-vf","scale=720:-2","-q:v","2",dest]);
      out.push("/thumbs/"+name);
    }catch{}
  } return out;
}
function viralMeta(score,motivo,title,timestamp){
  const hot=score>=90?"¡AQUÍ FUE QUE SE PUSO BUENO! 🔥":score>=75?"ESTO SE CALENTÓ DE UNA 🔥":"OJO CON ESTE MOMENTO 👀";
  const portada=score>=85?"AQUÍ SE PUSO BUENO":"MIRA LO QUE PASÓ";
  return {score_viral:score,motivo,timestamp,titulo_viral:hot,descripcion:"Momento detectado en "+title+". El sistema encontró "+motivo.toLowerCase()+" y lo preparó listo pa' publicar. 🔥",hashtags:"#ClipRD #RD #Viral #TikTokRD #Reels #Shorts #Tendencia #ViralRD #CreatorRD #Contenido",texto_portada:portada};
}
function publicClip(file,title,start,end,thumbs=[],extra={}){
  return {id:id(),title,url:"/clips/"+file,coverUrl:thumbs[1]||thumbs[0]||null,thumbnails:thumbs,start,end,duration:Math.max(0,end-start),createdAt:now(),status:"ready",type:"AUTO",...extra};
}
function addClip(c){library.push(c);saveLibrary();}

async function analyzeAudio(file,target){
  try{
    const r=await run("ffmpeg",["-hide_banner","-ss","0","-t","30","-i",file,"-af","astats=metadata=1:reset=1,volumedetect","-f","null","-"],l=>addLog(target,l.trim()),{timeout:45000});
    const all=(r.stderr||"");
    const max=Number((all.match(/max_volume:\s*(-?[\d.]+)/)||[])[1]);
    if(Number.isFinite(max))return {maxDb:max};
  }catch{}
  return null;
}
function scoreFromDb(db){if(db>=-1)return 98;if(db>=-3)return 92;if(db>=-6)return 84;if(db>=-10)return 72;if(db>=-16)return 58;return 25;}

async function createLiveViralClip(){
  if(!live.active||!live.recording||!fs.existsSync(live.recording))return;
  const size=fs.statSync(live.recording).size;
  live.bytes=size;
  if(size<2_000_000||size===live.lastSize)return;
  live.lastSize=size;
  const elapsed=Math.floor((Date.now()-new Date(live.startedAt).getTime())/1000);
  if(elapsed-live.lastAnalyzed<20)return;
  live.lastAnalyzed=elapsed;
  if(Date.now()<live.cooldownUntil)return;
  live.status="analizando";
  addLog(live,"Analizando energía del LIVE…");
  const a=await analyzeAudio(live.recording,live);
  const score=scoreFromDb(a?.maxDb??-30);
  if(score<72){live.status="recording";addLog(live,"Sin pico suficiente · no se genera clip");return;}
  const before=10,after=35,duration=before+after,start=Math.max(0,elapsed-before-duration);
  const idx=live.clips+1,base="live-"+Date.now()+"-"+idx,filename=base+".mp4",output=path.join(dirs.clips,filename);
  const motivo=score>=90?"pico fuerte de volumen + alta energía":"subida brusca de energía";
  addLog(live,"🔥 Pico detectado · "+score+"/100 · creando clip");
  try{
    await run("ffmpeg",["-y","-analyzeduration","100M","-probesize","100M","-ss",String(start),"-i",live.recording,"-t",String(duration),"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast","-c:a","aac","-movflags","+faststart",output],l=>addLog(live,l.trim()),{timeout:120000});
    if(fs.existsSync(output)&&fs.statSync(output).size>500000){
      const thumbs=await makeThumbs(live.recording,base,start,duration);
      const meta=viralMeta(score,motivo,live.title,new Date(start*1000).toISOString().slice(11,19));
      addClip(publicClip(filename,meta.titulo_viral,start,start+duration,thumbs,{...meta,type:"LIVE"}));
      live.clips++;live.cooldownUntil=Date.now()+60_000;live.status="recording";
      addLog(live,"🔥 Clip viral listo y enviado a Biblioteca");
    }
  }catch(e){addLog(live,"No se pudo cortar todavía: "+e.message.slice(-300));live.status="recording";}
}

app.get("/health",(req,res)=>res.json({ok:true,service:"CLIPRD 5.0",version:"5.0.0",time:now()}));
app.get("/api/clips",(req,res)=>res.json([...library].sort((a,b)=>(b.score_viral||0)-(a.score_viral||0)||b.createdAt.localeCompare(a.createdAt))));
app.get("/api/jobs/:jobId",(req,res)=>res.json(jobs.get(req.params.jobId)||{error:"not found"}));
app.get("/live/status",(req,res)=>res.json({active:live.active,sourceUrl:live.sourceUrl,videoId:live.videoId,startedAt:live.startedAt,status:live.status,clips:live.clips,bytes:live.bytes,elapsed:live.startedAt?Math.floor((Date.now()-new Date(live.startedAt))/1000):0,log:live.log.slice(-60)}));

app.post("/auto-clips",(req,res)=>{
  const {sourceUrl,clipLength=45,maxClips=1}=req.body||{};
  if(!sourceUrl)return res.status(400).json({error:"sourceUrl requerido"});
  const job={id:id(),status:"queued",progress:0,message:"Preparando descarga",log:[],createdAt:now()};jobs.set(job.id,job);res.status(202).json({jobId:job.id});
  (async()=>{try{
    job.status="running";job.progress=5;const url=normalizeYoutube(sourceUrl),base="auto-"+Date.now(),input=path.join(dirs.downloads,base+".mp4");
    const access=await downloadYoutube(url,input,job);
    if(!fs.existsSync(input))throw new Error("yt-dlp terminó sin crear el video");
    job.progress=74;job.message="Analizando duración";const total=Math.floor(await ffDuration(input));if(!total)throw new Error("No se pudo leer la duración");
    const count=Math.max(1,Math.min(Number(maxClips)||1,20)),len=Math.max(5,Number(clipLength)||45),step=Math.max(len,Math.floor(total/count));
    for(let i=0;i<count;i++){
      const start=Math.min(Math.max(0,i*step),Math.max(0,total-len)),end=Math.min(total,start+len),filename=base+"-clip-"+(i+1)+".mp4",output=path.join(dirs.clips,filename);
      job.message="Creando clip "+(i+1)+" de "+count;job.progress=75+Math.round((i/count)*20);
      await run("ffmpeg",["-y","-ss",String(start),"-i",input,"-t",String(end-start),"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast","-c:a","aac","-movflags","+faststart",output],l=>addLog(job,l.trim()));
      const thumbs=await makeThumbs(input,base+"-clip-"+(i+1),start,end-start);
      const meta=viralMeta(70,"momento seleccionado automáticamente",access.meta.title||"Video",new Date(start*1000).toISOString().slice(11,19));
      addClip(publicClip(filename,meta.titulo_viral,start,end,thumbs,{...meta,type:"AUTO"}));
    }
    job.status="done";job.progress=100;job.message="Clips listos";
  }catch(e){job.status="error";job.message=e.message;addLog(job,e.message);}})();
});

app.post("/live/start",(req,res)=>{
  const {sourceUrl,clipLength=45}=req.body||{};
  if(!sourceUrl)return res.status(400).json({error:"sourceUrl requerido"});
  if(live.active)return res.status(409).json({error:"Live ya activo"});
  const stamp=Date.now(),recording=path.join(dirs.live,"live-"+stamp+".ts");
  live={active:true,sourceUrl:normalizeYoutube(sourceUrl),startedAt:now(),process:null,recording,timer:null,clips:0,status:"starting",log:[],bytes:0,lastSize:0,lastAnalyzed:0,cooldownUntil:0,videoId:youtubeId(sourceUrl),title:"LIVE"};
  addLog(live,"Conectando al LIVE desde ahora…");
  (async()=>{try{
    const access=await probeYoutube(live.sourceUrl,live);if(!live.active)return;
    live.title=access.meta.title||"LIVE";live.status="recording";addLog(live,"🔴 REC · "+live.title);
    const args=[...ytBaseArgs(),...access.profile.args,"--hls-use-mpegts","--retries","infinite","--fragment-retries","infinite","-o",recording,live.sourceUrl];
    const p=command("yt-dlp",args);live.process=p;
    p.stdout.on("data",d=>addLog(live,String(d).trim()));p.stderr.on("data",d=>addLog(live,String(d).trim()));
    p.on("close",()=>{if(live.active){live.active=false;live.status="stopped";addLog(live,"Extractor detenido");}});
  }catch(e){live.status="error";live.active=false;addLog(live,"LIVE NO INICIADO: "+e.message);}})();
  live.timer=setInterval(()=>createLiveViralClip().catch(e=>addLog(live,e.message)),Math.max(15,Number(clipLength)||45)*1000);
  res.json({active:true,message:"🟢 Live conectado. Analizando momentos virales",clipLength});
});

app.post("/live/stop",(req,res)=>{
  if(!live.active)return res.json({active:false,status:"already stopped"});
  live.status="stopping";addLog(live,"DETENIENDO LIVE…");clearInterval(live.timer);killTree(live.process);
  setTimeout(()=>{live.active=false;live.status="stopped";addLog(live,"LIVE detenido");},800);
  res.json({active:false,status:"stopping"});
});

app.use((req,res,next)=>{if(req.method==="GET")return res.sendFile(path.join(__dirname,"public","index.html"));next();});
app.listen(PORT,"127.0.0.1",()=>console.log("CLIPRD 5.0 listo en http://127.0.0.1:"+PORT));