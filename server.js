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
async function downloadYoutube(url,out,job){
 const profiles=[
  {name:"Automático",args:[]},
  {name:"TV",args:["--extractor-args","youtube:player_client=tv"]},
  {name:"Android",args:["--extractor-args","youtube:player_client=android"]}
 ];
 let last;
 for(let i=0;i<profiles.length;i++){
  try{
   job.message="Conectando a YouTube · "+profiles[i].name;job.progress=Math.max(job.progress,3);
   console.log("CLIPRD DOWNLOAD",i+1,profiles[i].name,url);
   await run("yt-dlp",["--ignore-config","--no-playlist","--newline","--socket-timeout","30","--retries","3","--fragment-retries","5","--concurrent-fragments","1",...profiles[i].args,"--merge-output-format","mp4","-o",out,url],{
    timeout:20*60*1000,
    onLine:s=>{const p=parsePct(s);if(p!==null){job.progress=Math.max(3,Math.min(70,p*.7));job.message="Descargando "+p.toFixed(1)+"%"}}
   });
   return;
  }catch(e){last=e;console.log("Perfil falló:",profiles[i].name,e.message.slice(-240));}
 }
 throw last||new Error("No fue posible descargar el video");
}
function safeKill(p){try{if(p&&!p.killed)p.kill("SIGKILL")}catch{}}

app.get("/health",(req,res)=>res.json({ok:true,service:"CLIPRD 4.0 Local Creator Engine",version:"4.0.0"}));
app.get("/api/status",(req,res)=>res.json({live:{active:live.active,message:live.message,progress:live.progress,clips:live.clips},jobs:[...jobs.values()].map(j=>({id:j.id,type:j.type,status:j.status,progress:j.progress,message:j.message,error:j.error||null}))}));
app.get("/api/clips",(req,res)=>res.json({clips:listClips()}));

app.post("/api/auto",async(req,res)=>{
 const {sourceUrl,clipLength=45,maxClips=3}=req.body||{};
 if(!sourceUrl)return res.status(400).json({error:"Falta sourceUrl"});
 const job={id:id("auto"),type:"auto",status:"running",progress:0,message:"Preparando descarga",error:null,createdAt:Date.now()};
 jobs.set(job.id,job);res.json({ok:true,jobId:job.id});
 (async()=>{
  try{
   const source=join(DOWNLOADS,job.id+".%(ext)s");
   await downloadYoutube(sourceUrl,source,job);
   job.progress=72;job.message="Creando cortes…";
   const outPattern=join(CLIPS,"auto-"+Date.now()+"-%03d.mp4");
   await run("ffmpeg",["-y","-i",source.replace("%(ext)s","mp4"),"-map","0:v?","-map","0:a?","-c","copy","-f","segment","-segment_time",String(Math.max(5,Number(clipLength)||45)),"-reset_timestamps","1","-segment_start_number","1",outPattern],{
    timeout:20*60*1000,onErr:s=>{if(/time=/i.test(s)){job.progress=90;job.message="Generando clips…"}}
   });
   const all=listClips().filter(c=>c.id.startsWith("auto-")).slice(0,Number(maxClips)||3);
   job.status="done";job.progress=100;job.message=all.length+" clip(s) listos";
  }catch(e){job.status="error";job.error=e.message;job.message="Error al procesar"}
 })();
});

app.post("/api/live/start",(req,res)=>{
 const {sourceUrl}=req.body||{};
 if(!sourceUrl)return res.status(400).json({error:"Falta sourceUrl"});
 if(live.active)return res.status(409).json({error:"Ya hay un LIVE activo"});
 live.active=true;live.sourceUrl=sourceUrl;live.startedAt=Date.now();live.message="Conectando LIVE…";live.progress=0;live.clips=[];
 const stamp=Date.now();
 const yargs=["--ignore-config","--no-playlist","--live-from-start","--newline","--socket-timeout","30","--retries","3","--fragment-retries","5","--concurrent-fragments","1","-o","-",sourceUrl];
 const y=spawn("yt-dlp",yargs,{windowsHide:true});
 const fargs=["-hide_banner","-loglevel","warning","-i","pipe:0","-map","0:v?","-map","0:a?","-c","copy","-f","segment","-segment_time","45","-reset_timestamps","1",join(CLIPS,"live-"+stamp+"-%05d.mp4")];
 const f=spawn("ffmpeg",fargs,{windowsHide:true});
 live.processes=[y,f];live.message="LIVE conectado · cortes automáticos cada 45 segundos";
 y.stdout.pipe(f.stdin);
 y.stderr.on("data",d=>{const s=d.toString();if(/ERROR:/i.test(s))console.log("LIVE yt-dlp:",s.trim().slice(-500));});
 f.stderr.on("data",d=>{const s=d.toString();if(/error/i.test(s))console.log("LIVE ffmpeg:",s.trim().slice(-500));});
 const poll=setInterval(()=>{if(!live.active){clearInterval(poll);return} live.clips=listClips().filter(c=>c.id.startsWith("live-"));live.progress=Math.min(99,Math.floor((Date.now()-live.startedAt)/45000*10));},2000);
 const fail=e=>{if(live.active){live.message="LIVE detenido: "+e.message;live.active=false;live.processes.forEach(safeKill)}};
 y.on("error",fail);f.on("error",fail);
 res.json({ok:true,active:true,message:live.message});
});
app.post("/api/live/stop",(req,res)=>{
 live.message="Deteniendo LIVE…";
 live.active=false;live.processes.forEach(safeKill);live.processes=[];
 setTimeout(()=>{live.clips=listClips().filter(c=>c.id.startsWith("live-"));live.message="Detenido · "+live.clips.length+" clips disponibles";},800);
 res.json({ok:true,message:"LIVE detenido"});
});

app.get("*",(req,res)=>res.sendFile(join(PUBLIC,"index.html")));
app.listen(PORT,"127.0.0.1",()=>console.log("CLIPRD 4.0 listo en http://127.0.0.1:"+PORT+"\nHealth: http://127.0.0.1:"+PORT+"/health"));
