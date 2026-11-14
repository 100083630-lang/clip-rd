import express from "express";
import cors from "cors";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
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

const state={live:{active:false,sourceUrl:"",startedAt:null,clipLength:45,child:null,timer:null,recording:"",processed:0,lastError:null}};

function command(bin,args,{cwd=__dirname,timeout=0}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{cwd,windowsHide:true});
    let out="",err="";
    child.stdout?.on("data",d=>out+=d);
    child.stderr?.on("data",d=>err+=d);
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
  const y=spawnSync("yt-dlp",["--version"],{windowsHide:true});
  const f=spawnSync("ffmpeg",["-version"],{windowsHide:true});
  return {ytDlp:y.status===0,ffmpeg:f.status===0};
}
async function download(source,outFile){
  const formats=["bestvideo+bestaudio/best","bv*+ba/best","best"];
  let last;
  for(const format of formats){
    try{
      await command("yt-dlp",["--no-playlist","-f",format,"--merge-output-format","mp4","-o",outFile,source],{timeout:0});
      return;
    }catch(e){last=e}
  }
  throw last||new Error("No se pudo descargar el video");
}

app.get("/health",(req,res)=>res.json({ok:true,service:"CLIPRD 3.0 Local Engine",version:"3.0.0",tools:checkTools()}));
app.get("/api/clips",(req,res)=>res.json({clips:listClips()}));

app.post("/api/auto-clips",async(req,res)=>{
  console.log("LLEGÓ PETICIÓN DE CLIP",new Date().toLocaleTimeString());
  const {sourceUrl,clipLength=45,maxClips=3}=req.body||{};
  if(!sourceUrl) return res.status(400).json({error:"Falta sourceUrl"});
  const length=Math.max(5,Math.min(300,Number(clipLength)||45));
  const count=Math.max(1,Math.min(20,Number(maxClips)||3));
  const source=path.join(TMP,"source-"+Date.now()+".mp4");
  try{
    if(/^https?:\/\//i.test(sourceUrl)) await download(sourceUrl,source);
    else if(existsSync(sourceUrl)) await command("ffmpeg",["-y","-i",sourceUrl,"-c","copy",source]);
    else throw new Error("Ruta o URL inválida");
    const clips=[];
    for(let i=0;i<count;i++){
      const name=safeName("clip_"+Date.now()+"_"+(i+1))+".mp4";
      const target=path.join(CLIPS,name);
      await command("ffmpeg",["-y","-ss",String(i*length),"-i",source,"-t",String(length),"-map","0:v:0","-map","0:a?","-c:v","libx264","-c:a","aac","-movflags","+faststart",target]);
      clips.push({id:name,url:"/clips/"+encodeURIComponent(name),title:"Clip "+(i+1),start:i*length,end:(i+1)*length,duration:length});
    }
    res.json({ok:true,clips});
  }catch(e){
    console.error("AUTO CLIP ERROR:",e.message);
    res.status(500).json({error:e.message});
  }finally{if(existsSync(source)) try{unlinkSync(source)}catch{}}
});

async function makeLiveClip(){
  const s=state.live;
  if(!s.active) return;
  const start=s.processed*s.clipLength;
  const name=safeName("live_"+Date.now()+"_"+(s.processed+1))+".mp4";
  const target=path.join(CLIPS,name);
  try{
    await command("ffmpeg",["-y","-ss",String(start),"-i",s.recording,"-t",String(s.clipLength),"-map","0:v:0","-map","0:a?","-c","copy","-movflags","+faststart",target],{timeout:30000});
    if(existsSync(target)&&statSync(target).size>50000){s.processed++;console.log("LIVE CLIP CREADO:",name)}
    else if(existsSync(target)) unlinkSync(target);
  }catch(e){console.log("LIVE CLIP AÚN NO DISPONIBLE:",e.message)}
}

app.post("/live/start",(req,res)=>{
  if(state.live.active) return res.json({active:true,message:"Live Radar ya está activo"});
  const {sourceUrl,clipLength=45}=req.body||{};
  if(!sourceUrl) return res.status(400).json({error:"Falta sourceUrl"});
  const s=state.live;
  s.active=true;s.sourceUrl=sourceUrl;s.startedAt=new Date().toISOString();s.clipLength=Math.max(10,Number(clipLength)||45);s.processed=0;s.lastError=null;
  s.recording=path.join(LIVE,"live-"+Date.now()+".ts");
  s.child=spawn("yt-dlp",["--no-playlist","-f","bestvideo+bestaudio/best","-o",s.recording,sourceUrl],{windowsHide:true});
  s.child.stderr?.on("data",d=>{const msg=String(d);if(/ERROR/i.test(msg)) s.lastError=msg.slice(-500)});
  s.child.on("close",code=>{if(s.active&&code!==0)s.lastError="yt-dlp terminó con código "+code});
  s.timer=setInterval(()=>makeLiveClip(),s.clipLength*1000);
  console.log("LIVE INICIADO:",sourceUrl);
  res.json({active:true,message:"🟢 Live conectado. Cortes automáticos cada "+s.clipLength+" segundos"});
});

app.get("/live/status",(req,res)=>res.json({active:state.live.active,sourceUrl:state.live.sourceUrl,startedAt:state.live.startedAt,clipLength:state.live.clipLength,processedSegments:state.live.processed,lastError:state.live.lastError}));
app.post("/live/stop",async(req,res)=>{
  const s=state.live;
  if(!s.active) return res.json({active:false,message:"Live ya estaba detenido"});
  if(s.timer) clearInterval(s.timer);
  console.log("DETENIENDO LIVE...");
  if(process.platform==="win32"&&s.child?.pid) spawnSync("taskkill",["/PID",String(s.child.pid),"/T","/F"],{windowsHide:true});
  else s.child?.kill("SIGTERM");
  s.child=null;
  await new Promise(r=>setTimeout(r,1000));
  await makeLiveClip();
  s.active=false;s.timer=null;
  res.json({active:false,message:"🛑 Live detenido. Último segmento procesado."});
});

app.get("*",(req,res)=>res.sendFile(path.join(PUBLIC,"index.html")));
app.listen(PORT,"127.0.0.1",()=>console.log("CLIPRD 3.0 listo en http://127.0.0.1:"+PORT));
