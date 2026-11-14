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
const library=[];
let live={active:false,sourceUrl:null,startedAt:null,process:null,recording:null,timer:null,clips:0,status:"idle",log:[]};

function id(){return Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)}
function now(){return new Date().toISOString()}
function addLog(target,message){target.log.push({time:now(),message}); if(target.log.length>100)target.log.shift()}
function command(name,args,options={}){return spawn(name,args,{windowsHide:true,...options})}
function normalizeYoutube(url){
  try{
    const u=new URL(url);
    if(u.hostname.includes("youtu.be")) return "https://www.youtube.com/watch?v="+u.pathname.slice(1);
    if(u.pathname.startsWith("/shorts/")||u.pathname.startsWith("/live/")){
      const id=u.pathname.split("/")[2]; return "https://www.youtube.com/watch?v="+id;
    }
  }catch{}
  return url;
}
function run(cmd,args,onLine){
  return new Promise((resolve,reject)=>{
    const p=command(cmd,args);
    let stderr="",stdout="";
    p.stdout.on("data",d=>{stdout+=d; onLine?.(String(d));});
    p.stderr.on("data",d=>{stderr+=d; onLine?.(String(d));});
    p.on("error",reject);
    p.on("close",code=>code===0?resolve({stdout,stderr}):reject(new Error(stderr||stdout||cmd+" exit "+code)));
  });
}
async function makeThumbs(input,base,start,duration){
  const points=[0.1,0.5,0.85];
  const out=[];
  for(let i=0;i<points.length;i++){
    const name=base+"-"+(i+1)+".jpg", dest=path.join(dirs.thumbs,name);
    const t=Math.max(0,start+duration*points[i]);
    try{await run("ffmpeg",["-y","-ss",String(t),"-i",input,"-frames:v","1","-q:v","2",dest]);out.push("/thumbs/"+name)}catch{}
  }
  return out;
}
function publicClip(file,title,start,end,thumbs=[]){
  return {id:id(),title,url:"/clips/"+file,coverUrl:thumbs[1]||thumbs[0]||null,thumbnails:thumbs,start,end,duration:Math.max(0,end-start),createdAt:now(),status:"ready"};
}

app.get("/health",(req,res)=>res.json({ok:true,service:"CLIPRD 5.0",version:"5.0.0",time:now()}));
app.get("/api/clips",(req,res)=>res.json([...library].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))));
app.get("/api/jobs/:jobId",(req,res)=>res.json(jobs.get(req.params.jobId)||{error:"not found"}));
app.get("/live/status",(req,res)=>res.json({active:live.active,sourceUrl:live.sourceUrl,startedAt:live.startedAt,status:live.status,clips:live.clips,log:live.log.slice(-20)}));

app.post("/auto-clips",async(req,res)=>{
  const {sourceUrl,clipLength=45,maxClips=1}=req.body||{};
  if(!sourceUrl)return res.status(400).json({error:"sourceUrl requerido"});
  const job={id:id(),status:"queued",progress:0,message:"Preparando descarga",log:[],createdAt:now()};
  jobs.set(job.id,job); res.status(202).json({jobId:job.id});
  (async()=>{
    try{
      job.status="running"; job.progress=5;
      const url=normalizeYoutube(sourceUrl);
      const base="auto-"+Date.now();
      const input=path.join(dirs.downloads,base+".mp4");
      job.message="Descargando video"; addLog(job,"yt-dlp iniciado");
      await run("yt-dlp",["--no-playlist","--newline","--socket-timeout","30","--retries","3","--fragment-retries","3","--merge-output-format","mp4","-o",input,url],line=>{
        addLog(job,line.trim()); const m=line.match(/(\d{1,3}\.\d+)%/); if(m){job.progress=Math.min(70,5+Number(m[1])*0.65);job.message="Descargando "+m[1]+"%";}
      });
      if(!fs.existsSync(input))throw new Error("yt-dlp terminó sin crear el video");
      job.progress=72; job.message="Analizando duración";
      const probe=await run("ffprobe",["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",input]);
      const total=Math.floor(Number(probe.stdout.trim())||0);
      if(!total)throw new Error("No se pudo leer la duración");
      const count=Math.max(1,Math.min(Number(maxClips)||1,20));
      const len=Math.max(5,Number(clipLength)||45);
      const step=Math.max(len,Math.floor(total/count));
      for(let i=0;i<count;i++){
        const start=Math.min(Math.max(0,i*step),Math.max(0,total-len));
        const end=Math.min(total,start+len);
        const filename=base+"-clip-"+(i+1)+".mp4";
        const output=path.join(dirs.clips,filename);
        job.message="Creando clip "+(i+1)+" de "+count; job.progress=75+Math.round((i/count)*20);
        await run("ffmpeg",["-y","-ss",String(start),"-i",input,"-t",String(end-start),"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast","-c:a","aac","-movflags","+faststart",output],line=>addLog(job,line.trim()));
        const thumbs=await makeThumbs(input,base+"-clip-"+(i+1),start,end-start);
        library.push(publicClip(filename,"Clip "+(i+1)+" · "+path.basename(url).slice(0,40),start,end,thumbs));
      }
      job.status="done";job.progress=100;job.message="Clips listos";
    }catch(e){job.status="error";job.message=e.message;addLog(job,e.message);}
  })();
});

app.post("/live/start",(req,res)=>{
  const {sourceUrl,clipLength=45}=req.body||{};
  if(!sourceUrl)return res.status(400).json({error:"sourceUrl requerido"});
  if(live.active)return res.status(409).json({error:"Live ya activo"});
  const stamp=Date.now(),recording=path.join(dirs.live,"live-"+stamp+".mp4");
  live={active:true,sourceUrl:normalizeYoutube(sourceUrl),startedAt:now(),process:null,recording,timer:null,clips:0,status:"starting",log:[]};
  addLog(live,"Iniciando captura LIVE");
  const p=command("yt-dlp",["--no-playlist","--live-from-start","--newline","--socket-timeout","30","--retries","infinite","--fragment-retries","infinite","--merge-output-format","mp4","-o",recording,live.sourceUrl]);
  live.process=p; live.status="recording";
  p.stdout.on("data",d=>addLog(live,String(d).trim()));
  p.stderr.on("data",d=>addLog(live,String(d).trim()));
  p.on("close",()=>{if(live.active){live.status="stopped";live.active=false;}});
  const segment=async()=>{
    if(!live.active)return;
    const elapsed=Math.floor((Date.now()-new Date(live.startedAt).getTime())/1000);
    if(elapsed<clipLength+3||!fs.existsSync(recording))return;
    const idx=++live.clips,filename="live-"+stamp+"-"+idx+".mp4",output=path.join(dirs.clips,filename);
    const start=Math.max(0,elapsed-clipLength-2);
    try{
      await run("ffmpeg",["-y","-ss",String(start),"-i",recording,"-t",String(clipLength),"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast","-c:a","aac","-movflags","+faststart",output]);
      if(fs.existsSync(output)&&fs.statSync(output).size>100000){
        const thumbs=await makeThumbs(recording,"live-"+stamp+"-"+idx,start,clipLength);
        library.push(publicClip(filename,"LIVE · Corte automático "+idx,start,start+clipLength,thumbs));
        addLog(live,"Clip "+idx+" enviado a Biblioteca");
      }
    }catch(e){addLog(live,"Clip aún no disponible: "+e.message)}
  };
  live.timer=setInterval(segment,Math.max(10,clipLength)*1000);
  res.json({active:true,message:"LIVE iniciado",clipLength});
});

app.post("/live/stop",async(req,res)=>{
  if(!live.active)return res.json({active:false,status:"already stopped"});
  live.status="stopping";addLog(live,"Deteniendo LIVE");
  clearInterval(live.timer);
  if(live.process&&live.process.pid){command("taskkill",["/PID",String(live.process.pid),"/T","/F"]);}
  setTimeout(()=>{live.active=false;live.status="stopped";addLog(live,"LIVE detenido");},500);
  res.json({active:false,status:"stopping"});
});

app.use((req,res,next)=>{if(req.method==="GET")return res.sendFile(path.join(__dirname,"public","index.html"));next();});
app.listen(PORT,"127.0.0.1",()=>console.log("CLIPRD 5.0 listo en http://127.0.0.1:"+PORT));
