import express from "express";
import cors from "cors";
import {spawn} from "node:child_process";
import {mkdirSync, existsSync, statSync, readdirSync} from "node:fs";
import {join, resolve, basename} from "node:path";

const app=express();
const PORT=3847;
const ROOT=process.cwd();
const PUBLIC=join(ROOT,"public");
const DATA=join(ROOT,"data");
const DOWNLOADS=join(DATA,"downloads");
const CLIPS=join(DATA,"clips");
[DATA,DOWNLOADS,CLIPS].forEach(p=>mkdirSync(p,{recursive:true}));

app.use(cors({origin:true}));
app.use(express.json({limit:"2mb"}));
app.use("/files",express.static(DATA,{acceptRanges:true,maxAge:0}));
app.use(express.static(PUBLIC));

const jobs=new Map();
const live={active:false,sourceUrl:"",startedAt:null,processes:[],clips:[],message:"Idle",progress:0};

function id(prefix="job"){return prefix+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)}
function run(cmd,args,{onLine,onErr,timeout=0}={}){
 return new Promise((resolve,reject)=>{
  const p=spawn(cmd,args,{windowsHide:true,shell:false});
  let out="",err="",done=false;
  const finish=(fn,v)=>{if(done)return;done=true; if(timer)clearTimeout(timer); fn(v)};
  const line=s=>s.toString().split(/\r?\n/).filter(Boolean);
  p.stdout.on("data",d=>{out+=d;line(d).forEach(x=>onLine?.(x))});
  p.stderr.on("data",d=>{err+=d;line(d).forEach(x=>onErr?.(x))});
  p.on("error",e=>finish(reject,e));
  p.on("close",code=>code===0?finish(resolve,{out,err}):finish(reject,new Error((err||out||"Proceso falló")+"\nCódigo "+code)));
  const timer=timeout?setTimeout(()=>{try{p.kill("SIGKILL")}catch{};finish(reject,new Error(cmd+" agotó el tiempo"))},timeout):null;
 });
}
function parsePct(s){const m=s.match(/(\d+(?:\.\d+)?)%/);return m?Number(m[1]):null}
function listClips(){
 return readdirSync(CLIPS).filter(x=>x.endsWith(".mp4")).map(name=>{
  const st=statSync(join(CLIPS,name));return {id:name,title:basename(name,".mp4"),url:"/files/clips/"+encodeURIComponent(name),createdAt:st.mtimeMs,size:st.size}
 }).sort((a,b)=>b.createdAt-a.createdAt);
}
function normalizeYoutubeUrl(raw){
 try{
  const u=new URL(raw);
  const host=u.hostname.replace(/^www\./,"");
  let id="";
  if(host==="youtu.be") id=u.pathname.split("/").filter(Boolean)[0]||"";
  else {
   const parts=u.pathname.split("/").filter(Boolean);
   if(parts[0]==="shorts"||parts[0]==="live"||parts[0]==="embed") id=parts[1]||"";
   else id=u.searchParams.get("v")||"";
  }
  return id&&/^[A-Za-z0-9_-]{11}$/.test(id)?"https://www.youtube.com/watch?v="+id:raw;
 }catch{return raw}
}
async function downloadYoutube(rawUrl,out,job){
 const url=normalizeYoutubeUrl(rawUrl);
 const common=["--ignore-config","--no-playlist","--newline","--force-ipv4","--socket-timeout","20","--retries","10","--fragment-retries","10","--retry-sleep","exp=1:20","--concurrent-fragments","1","--no-part","--merge-output-format","mp4","-o",out];
 const profiles=[
  {name:"YouTube estándar",args:["--extractor-args","youtube:player_client=web,android"]},
  {name:"Android",args:["--extractor-args","youtube:player_client=android"]},
  {name:"iOS",args:["--extractor-args","youtube:player_client=ios"]}
 ];
 let last;
 for(let i=0;i<profiles.length;i++){
  try{
   job.message="Conectando a YouTube · "+profiles[i].name;
   job.progress=Math.max(job.progress,3);
   console.log("CLIPRD DOWNLOAD",i+1,profiles[i].name,url);
   await run("yt-dlp",[...common,...profiles[i].args,url],{
    timeout:30*60*1000,
    onLine:s=>{
     const p=parsePct(s);
     if(p!==null){
      job.progress=Math.max(3,Math.min(70,p*.7));
      job.message="Descargando "+p.toFixed(1)+"%";
     }
    },
    onErr:s=>{ if(/ERROR:|WARNING:/i.test(s)) console.log("yt-dlp:",s.trim().slice(-700)); }
   });
   if(!existsSync(out)||statSync(out).size<1024) throw new Error("yt-dlp terminó sin crear un MP4 válido");
   return;
  }catch(e){
   last=e;
   console.log("Perfil falló:",profiles[i].name,e.message.slice(-500));
   if(existsSync(out)){try{const {unlinkSync}=await import("node:fs");unlinkSync(out)}catch{}}
  }
 }
 throw new Error("YouTube no respondió con un formato descargable después de 3 intentos. Detalle: "+(last?.message||"sin detalle"));
}
