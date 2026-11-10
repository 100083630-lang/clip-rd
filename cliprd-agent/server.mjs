import http from "node:http";
import { spawn } from "node:child_process";
import { mkdir, rm, readdir, stat, access } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 3847);
const HOST = process.env.HOST || "127.0.0.1";
const OUT = path.resolve(process.env.CLIPRD_OUTPUT_DIR || path.join(os.homedir(), "CLIPRD-Clips"));
const BROWSER = (process.env.YTDLP_BROWSER || "").trim();
const COOKIE_FILE = (process.env.YTDLP_COOKIE_FILE || "").trim();
await mkdir(OUT, { recursive: true });

function run(cmd,args,cwd,timeoutMs=0){
  return new Promise((resolve,reject)=>{
    const p=spawn(cmd,args,{cwd,windowsHide:true});
    let out="",err="",settled=false;
    const done=(fn,v)=>{if(!settled){settled=true;fn(v)}};
    p.stdout.on("data",d=>out+=d);
    p.stderr.on("data",d=>err+=d);
    p.on("error",e=>done(reject,new Error(`${cmd} no está disponible: ${e.message}`)));
    const timer=timeoutMs?setTimeout(()=>{p.kill();done(reject,new Error(`${cmd} superó el tiempo máximo de espera`))},timeoutMs):null;
    p.on("close",code=>{if(timer)clearTimeout(timer);code===0?done(resolve,{out,err}):done(reject,new Error((err||out||`${cmd} terminó con código ${code}`).slice(-6000)))});
  });
}
const cors=()=>({"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"86400"});
function json(res,code,body){res.writeHead(code,{"content-type":"application/json; charset=utf-8",...cors()});res.end(JSON.stringify(body))}
async function body(req){let raw="";for await(const c of req){raw+=c;if(raw.length>2_000_000)throw new Error("Solicitud demasiado grande")}return raw?JSON.parse(raw):{}}
function safeUrl(v){const s=String(v||"").trim();if(!/^https?:\/\//i.test(s))throw new Error("La URL debe comenzar con http:// o https://");return s}
function safeClips(clips){if(!Array.isArray(clips)||!clips.length)throw new Error("No hay clips para generar");return clips.slice(0,12).map((c,i)=>{const start=Number(c.start),end=Number(c.end);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start>600)throw new Error(`Segmento inválido #${i+1}`);return{start,end}})}
async function commandVersion(cmd,args){try{const r=await run(cmd,args,undefined,15000);return(r.out||r.err||"").trim().split(/\r?\n/)[0]||"ok"}catch{return null}}
async function dependencyStatus(){let cookieFile=null;if(COOKIE_FILE){try{await access(COOKIE_FILE);cookieFile=true}catch{cookieFile=false}}const[ytDlp,ffmpeg]=await Promise.all([commandVersion("yt-dlp",["--version"]),commandVersion("ffmpeg",["-version"])]);return{ytDlp,ffmpeg,browser:BROWSER||null,cookieFile:COOKIE_FILE?(cookieFile?"configured":"missing"):null}}

async function downloadSource(sourceUrl,work){
  const template=path.join(work,"source.%(ext)s");
  const args=["--no-playlist","--restrict-filenames","-f","bv*+ba/b/best","--merge-output-format","mp4","-o",template,sourceUrl];
  if(COOKIE_FILE)args.unshift("--cookies",COOKIE_FILE);else if(BROWSER)args.unshift("--cookies-from-browser",BROWSER);
  try{await run("yt-dlp",args,work,20*60*1000)}catch(error){
    const m=error instanceof Error?error.message:String(error);
    if(/DPAPI/i.test(m))throw new Error("Windows bloqueó las cookies del navegador (DPAPI). Elimina YTDLP_BROWSER y usa un cookies.txt explícito si el contenido autorizado requiere autenticación.");
    throw error;
  }
  const files=await readdir(work);
  const name=files.find(f=>/\.(mp4|mkv|webm|mov)$/i.test(f));
  if(!name)throw new Error("yt-dlp terminó pero no produjo un video utilizable");
  return path.join(work,name);
}
async function mediaDuration(source,work){
  const r=await run("ffprobe",["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",source],work,30000);
  const n=Number(r.out.trim());if(!Number.isFinite(n)||n<=0)throw new Error("No se pudo leer la duración del video");return n;
}
async function audioBasedSegments(source,work,clipLength,maxClips){
  const duration=await mediaDuration(source,work);
  let err="";
  try{const r=await run("ffmpeg",["-hide_banner","-i",source,"-af","silencedetect=noise=-35dB:d=0.7","-f","null","-"],work,10*60*1000);err=r.err}catch(e){err=e instanceof Error?e.message:String(e)}
  const starts=[...err.matchAll(/silence_start:\s*([0-9.]+)/g)].map(m=>Number(m[1]));
  const ends=[...err.matchAll(/silence_end:\s*([0-9.]+)/g)].map(m=>Number(m[1]));
  const silent=[];for(let i=0;i<Math.max(starts.length,ends.length);i++)silent.push({start:starts[i]??0,end:ends[i]??duration});
  silent.sort((a,b)=>a.start-b.start);
  const active=[];let cursor=0;
  for(const s of silent){const a=Math.max(cursor,0),b=Math.min(Math.max(a,s.start),duration);if(b-a>=Math.max(3,clipLength*.35))active.push({start:a,end:b});cursor=Math.max(cursor,Math.min(duration,s.end))}
  if(duration-cursor>=Math.max(3,clipLength*.35))active.push({start:cursor,end:duration});
  const candidates=[];
  for(const r of active){for(let p=r.start;p<r.end;p+=clipLength){const end=Math.min(r.end,p+clipLength);if(end-p>=Math.max(8,clipLength*.55))candidates.push({start:Math.round(p),end:Math.round(end),score:Math.round((end-p)*100)})}}
  if(!candidates.length){const count=Math.min(maxClips,Math.max(1,Math.floor(duration/clipLength)));for(let i=0;i<count;i++){const start=Math.round((duration-clipLength)*((i+.5)/count));candidates.push({start:Math.max(0,start),end:Math.min(duration,Math.max(0,start)+clipLength),score:1})}}
  candidates.sort((a,b)=>b.score-a.score);
  const selected=[];for(const c of candidates){if(selected.length>=maxClips)break;if(selected.every(x=>c.end<=x.start||c.start>=x.end))selected.push(c)}
  return selected.sort((a,b)=>a.start-b.start).map(({start,end})=>({start,end}));
}
async function renderSource(source,clips,work){
  const job=crypto.randomUUID(),jobOut=path.join(OUT,job);await mkdir(jobOut,{recursive:true});const outputs=[];
  for(let i=0;i<clips.length;i++){const c=clips[i],name=`clip-${String(i+1).padStart(2,"0")}-${Math.round(c.start)}-${Math.round(c.end)}.mp4`,dest=path.join(jobOut,name);
    await run("ffmpeg",["-y","-ss",String(c.start),"-to",String(c.end),"-i",source,"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast","-crf","21","-c:a","aac","-movflags","+faststart",dest],work,20*60*1000);
    outputs.push({index:i+1,start:c.start,end:c.end,file:`/files/${encodeURIComponent(job)}/${encodeURIComponent(name)}`});
  }return{job,outputs};
}
async function process(sourceUrl,clips){const job=crypto.randomUUID(),work=path.join(os.tmpdir(),"cliprd",job);await mkdir(work,{recursive:true});try{const source=await downloadSource(sourceUrl,work);return await renderSource(source,clips,work)}finally{await rm(work,{recursive:true,force:true}).catch(()=>{})}}
async function autoProcess(sourceUrl,clipLength,maxClips){const job=crypto.randomUUID(),work=path.join(os.tmpdir(),"cliprd",job);await mkdir(work,{recursive:true});try{const source=await downloadSource(sourceUrl,work);const clips=await audioBasedSegments(source,work,clipLength,maxClips);const result=await renderSource(source,clips,work);return{...result,clips,analysis:"audio-activity"}}finally{await rm(work,{recursive:true,force:true}).catch(()=>{})}}

const server=http.createServer(async(req,res)=>{try{
  if(req.method==="OPTIONS"){res.writeHead(204,cors());return res.end()}
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==="GET"&&url.pathname==="/health"){const dependencies=await dependencyStatus();const ok=Boolean(dependencies.ytDlp&&dependencies.ffmpeg)&&dependencies.cookieFile!=="missing";return json(res,ok?200:503,{ok,service:"CLIPRD Local Agent",version:"1.1.0",outputDir:OUT,dependencies,features:{autoClips:"audio-activity"}})}
  if(req.method==="POST"&&url.pathname==="/render"){const b=await body(req);const result=await process(safeUrl(b.sourceUrl),safeClips(b.clips));const origin=`http://${HOST==="0.0.0.0"?"127.0.0.1":HOST}:${PORT}`;result.outputs=result.outputs.map(x=>({...x,url:origin+x.file}));return json(res,200,result)}
  if(req.method==="POST"&&url.pathname==="/auto-clips"){const b=await body(req);const len=Math.max(10,Math.min(180,Number(b.clipLength)||45));const max=Math.max(1,Math.min(8,Number(b.maxClips)||4));const result=await autoProcess(safeUrl(b.sourceUrl),len,max);const origin=`http://${HOST==="0.0.0.0"?"127.0.0.1":HOST}:${PORT}`;result.outputs=result.outputs.map(x=>({...x,url:origin+x.file}));return json(res,200,result)}
  if(req.method==="GET"&&url.pathname.startsWith("/files/")){const rel=decodeURIComponent(url.pathname.slice(7)),target=path.resolve(OUT,rel);if(!target.startsWith(OUT+path.sep))return json(res,403,{error:"Ruta inválida"});const info=await stat(target);if(!info.isFile())return json(res,404,{error:"Archivo no encontrado"});res.writeHead(200,{"content-type":"video/mp4","content-length":info.size,"access-control-allow-origin":"*"});return createReadStream(target).pipe(res)}
  return json(res,404,{error:"Not found"});
}catch(error){return json(res,400,{error:error instanceof Error?error.message:String(error)})}});
server.listen(PORT,HOST,()=>console.log(`CLIPRD Local Agent v1.1.0 listo en http://${HOST}:${PORT}`));
