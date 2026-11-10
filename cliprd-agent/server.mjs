import http from "node:http";
import { spawn } from "node:child_process";
import { mkdir, rm, readdir, stat, access } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const PORT=Number(process.env.PORT||3847);
const HOST=process.env.HOST||"127.0.0.1";
const OUT=path.resolve(process.env.CLIPRD_OUTPUT_DIR||path.join(os.homedir(),"CLIPRD-Clips"));
const BROWSER=(process.env.YTDLP_BROWSER||"").trim();
const COOKIE_FILE=(process.env.YTDLP_COOKIE_FILE||"").trim();
await mkdir(OUT,{recursive:true});

function run(cmd,args,cwd,timeoutMs=0){
  return new Promise((resolve,reject)=>{
    const p=spawn(cmd,args,{cwd,windowsHide:true});
    let out="",err="",done=false;
    const finish=(fn,v)=>{if(!done){done=true;fn(v)}};
    p.stdout.on("data",d=>out+=d);p.stderr.on("data",d=>err+=d);
    p.on("error",e=>finish(reject,new Error(`${cmd} no está disponible: ${e.message}`)));
    const timer=timeoutMs?setTimeout(()=>{p.kill();finish(reject,new Error(`${cmd} superó el tiempo máximo`))},timeoutMs):null;
    p.on("close",code=>{if(timer)clearTimeout(timer);code===0?finish(resolve,{out,err}):finish(reject,new Error((err||out||`${cmd} terminó con código ${code}`).slice(-6000)))});
  });
}
const cors=()=>({"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"86400"});
function json(res,code,body){res.writeHead(code,{"content-type":"application/json; charset=utf-8",...cors()});res.end(JSON.stringify(body))}
async function body(req){let raw="";for await(const c of req){raw+=c;if(raw.length>2_000_000)throw new Error("Solicitud demasiado grande")}return raw?JSON.parse(raw):{}}
function safeUrl(v){const s=String(v||"").trim();if(!/^https?:\/\//i.test(s))throw new Error("La URL debe comenzar con http:// o https://");return s}
function safeClips(clips){if(!Array.isArray(clips)||!clips.length)throw new Error("No hay clips para generar");return clips.slice(0,12).map((c,i)=>{const start=Number(c.start),end=Number(c.end);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start>600)throw new Error(`Segmento inválido #${i+1}`);return{start,end}})}
function ytArgs(base=[]){const a=[...base];if(COOKIE_FILE)a.unshift("--cookies",COOKIE_FILE);else if(BROWSER)a.unshift("--cookies-from-browser",BROWSER);return a}
async function commandVersion(cmd,args){try{const r=await run(cmd,args,undefined,15000);return(r.out||r.err||"").trim().split(/\r?\n/)[0]||"ok"}catch{return null}}
async function dependencyStatus(){let cookieFile=null;if(COOKIE_FILE){try{await access(COOKIE_FILE);cookieFile=true}catch{cookieFile=false}}const[ytDlp,ffmpeg]=await Promise.all([commandVersion("yt-dlp",["--version"]),commandVersion("ffmpeg",["-version"])]);return{ytDlp,ffmpeg,browser:BROWSER||null,cookieFile:COOKIE_FILE?(cookieFile?"configured":"missing"):null}}

async function getVideoMetadata(sourceUrl,work){
  try{
    const metaArgs=ytArgs(["--no-playlist","--skip-download","--write-subs","--write-auto-subs","--sub-langs","es.*,en.*","--sub-format","vtt","-o",path.join(work,"meta.%(ext)s"),"--print-json",sourceUrl]);
    const r=await run("yt-dlp",metaArgs,work,120000);
    const line=(r.out||"").split(/\r?\n/).find(x=>x.trim().startsWith("{"));if(!line)return {};
    const j=JSON.parse(line),raw=String(j.description||"").trim(),tags=Array.isArray(j.tags)?j.tags.map(t=>String(t).replace(/^#/,"")).filter(Boolean):[];
    const found=[...new Set([...raw.matchAll(/#[\p{L}\p{N}_]+/gu)].map(m=>m[0]),...tags.map(t=>"#"+t)])];
    const text=raw.length>900?raw.slice(0,900).replace(/\s+$/,"")+"…":raw;
    const subs=(await readdir(work).catch(()=>[])).filter(f=>/^meta\..+\.vtt$/i.test(f));
    let transcript=[];if(subs[0]){const vtt=await readFile(path.join(work,subs[0]),"utf8").catch(()=>"");transcript=parseVtt(vtt)}
    return{sourceTitle:String(j.title||""),sourceDescription:text,hashtags:found,transcript};
  }catch{return{}}
}
function parseVtt(vtt){
  const cues=[],blocks=String(vtt||"").replace(/\r/g,"").split(/\n\n+/);
  const toSec=t=>{const p=t.trim().split(":").map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1]};
  for(const block of blocks){const lines=block.split("\n").map(x=>x.trim()).filter(Boolean),time=lines.find(x=>x.includes("-->"));if(!time)continue;const parts=time.split("-->");if(parts.length<2)continue;const start=toSec(parts[0].replace(",",".").trim()),end=toSec(parts[1].trim().split(/\s+/)[0].replace(",",".")),text=lines.slice(lines.indexOf(time)+1).join(" ").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();if(text&&Number.isFinite(start)&&Number.isFinite(end))cues.push({start,end,text})}
  const clean=[];for(const c of cues){if(!clean.length||clean[clean.length-1].text!==c.text)clean.push(c)}return clean;
}
function clipCopy(c,metadata){
  const cues=(metadata.transcript||[]).filter(x=>x.end>=c.start&&x.start<=c.end),spoken=cues.map(x=>x.text).join(" ").replace(/\s+/g," ").trim(),excerpt=spoken.length>520?spoken.slice(0,520).replace(/\s+\S*$/,"")+"…":spoken,first=(spoken.split(/[.!?]+\s+/).find(x=>x.trim())||spoken||"Momento destacado del video").trim(),title=first.length>88?first.slice(0,85).replace(/\s+\S*$/,"")+"…":first;
  const sourceTag=metadata.sourceTitle?"🎬 "+metadata.sourceTitle:"🎬 CLIPRD",body=excerpt?"🔥 EN ESTE CORTE\n"+excerpt:"🔥 EN ESTE CORTE\nMomento destacado seleccionado automáticamente.",tags=(metadata.hashtags&&metadata.hashtags.length?metadata.hashtags.slice(0,12):["#CLIPRD","#clips","#shorts","#reels"]).join(" ");
  return{title,description:[sourceTag,"",body,"",tags].join("\n"),spoken:excerpt};
}
async function downloadSource(sourceUrl,work){
  const template=path.join(work,"source.%(ext)s");
  const args=ytArgs(["--no-playlist","--restrict-filenames","-f","bv*+ba/b/best","--merge-output-format","mp4","-o",template,sourceUrl]);
  try{await run("yt-dlp",args,work,20*60*1000)}catch(error){const m=error instanceof Error?error.message:String(error);if(/DPAPI/i.test(m))throw new Error("Windows bloqueó las cookies del navegador (DPAPI). Usa un cookies.txt explícito si el contenido autorizado requiere autenticación.");throw error}
  const files=await readdir(work);const name=files.find(f=>/\.(mp4|mkv|webm|mov)$/i.test(f));if(!name)throw new Error("yt-dlp terminó pero no produjo un video utilizable");return path.join(work,name);
}
async function mediaDuration(source,work){const r=await run("ffprobe",["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",source],work,30000);const n=Number(r.out.trim());if(!Number.isFinite(n)||n<=0)throw new Error("No se pudo leer la duración del video");return n}
async function audioBasedSegments(source,work,clipLength,maxClips){
  const duration=await mediaDuration(source,work);let err="";
  try{const r=await run("ffmpeg",["-hide_banner","-i",source,"-af","silencedetect=noise=-35dB:d=0.7","-f","null","-"],work,10*60*1000);err=r.err}catch(e){err=e instanceof Error?e.message:String(e)}
  const starts=[...err.matchAll(/silence_start:\s*([0-9.]+)/g)].map(m=>Number(m[1])),ends=[...err.matchAll(/silence_end:\s*([0-9.]+)/g)].map(m=>Number(m[1]));
  const silent=[];for(let i=0;i<Math.max(starts.length,ends.length);i++)silent.push({start:starts[i]??0,end:ends[i]??duration});silent.sort((a,b)=>a.start-b.start);
  const active=[];let cursor=0;for(const s of silent){const a=Math.max(cursor,0),b=Math.min(Math.max(a,s.start),duration);if(b-a>=Math.max(3,clipLength*.35))active.push({start:a,end:b});cursor=Math.max(cursor,Math.min(duration,s.end))}if(duration-cursor>=Math.max(3,clipLength*.35))active.push({start:cursor,end:duration});
  const candidates=[];for(const r of active){for(let p=r.start;p<r.end;p+=clipLength){const end=Math.min(r.end,p+clipLength);if(end-p>=Math.max(8,clipLength*.55))candidates.push({start:Math.round(p),end:Math.round(end),score:Math.round((end-p)*100)})}}
  if(!candidates.length){const count=Math.min(maxClips,Math.max(1,Math.floor(duration/clipLength)));for(let i=0;i<count;i++){const start=Math.round((duration-clipLength)*((i+.5)/count));candidates.push({start:Math.max(0,start),end:Math.min(duration,Math.max(0,start)+clipLength),score:1})}}
  candidates.sort((a,b)=>b.score-a.score);const selected=[];for(const c of candidates){if(selected.length>=maxClips)break;if(selected.every(x=>c.end<=x.start||c.start>=x.end))selected.push(c)}return selected.sort((a,b)=>a.start-b.start).map(({start,end})=>({start,end}));
}
async function renderSource(source,clips,work,metadata={}){
  const job=crypto.randomUUID(),jobOut=path.join(OUT,job);await mkdir(jobOut,{recursive:true});const outputs=[];
  for(let i=0;i<clips.length;i++){
    const c=clips[i],base=`clip-${String(i+1).padStart(2,"0")}-${Math.round(c.start)}-${Math.round(c.end)}`,name=base+".mp4",coverName=base+".jpg",dest=path.join(jobOut,name),coverDest=path.join(jobOut,coverName),thumbNames=[];
    await run("ffmpeg",["-y","-ss",String(c.start),"-to",String(c.end),"-i",source,"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast","-crf","21","-c:a","aac","-movflags","+faststart",dest],work,20*60*1000);
    // Extract a representative frame as a separate downloadable cover.
    const coverAt=Math.max(0,Number(c.start)+Math.min(2,Math.max(0,(Number(c.end)-Number(c.start))/3)));
    try{await run("ffmpeg",["-y","-ss",String(Math.min(2,Math.max(.2,duration/3))),"-i",dest,"-frames:v","1","-q:v","2",coverDest],work,60000)}catch{}
    const duration=Math.max(1,Number(c.end)-Number(c.start)),fractions=[0.08,.27,.48,.69,.88];
    for(let t=0;t<fractions.length;t++){const tn=base+"-thumb-"+(t+1)+".jpg",tp=path.join(jobOut,tn),at=Math.max(.1,duration*fractions[t]);try{await run("ffmpeg",["-y","-ss",String(at),"-i",dest,"-frames:v","1","-q:v","2",tp],work,60000);thumbNames.push(tn)}catch{}}
    const copy=clipCopy(c,metadata);
    outputs.push({
      index:i+1,start:c.start,end:c.end,
      file:`/files/${encodeURIComponent(job)}/${encodeURIComponent(name)}`,
      cover:`/files/${encodeURIComponent(job)}/${encodeURIComponent(coverName)}`,
      thumbnails:thumbNames.map(t=>`/files/${encodeURIComponent(job)}/${encodeURIComponent(t)}`),
      title:copy.title,
      sourceTitle:metadata.sourceTitle||"",
      sourceDescription:metadata.sourceDescription||"",
      clipTranscript:copy.spoken||"",
      hashtags:metadata.hashtags||[],
      description:copy.description,
      created:Date.now()
    });
  }
  return{job,outputs};
}
async function process(sourceUrl,clips){const job=crypto.randomUUID(),work=path.join(os.tmpdir(),"cliprd",job);await mkdir(work,{recursive:true});try{const source=await downloadSource(sourceUrl,work);const metadata=await getVideoMetadata(sourceUrl,work);return await renderSource(source,clips,work,metadata)}finally{await rm(work,{recursive:true,force:true}).catch(()=>{})}}
async function autoProcess(sourceUrl,clipLength,maxClips){const job=crypto.randomUUID(),work=path.join(os.tmpdir(),"cliprd",job);await mkdir(work,{recursive:true});try{const source=await downloadSource(sourceUrl,work);const metadata=await getVideoMetadata(sourceUrl,work);const clips=await audioBasedSegments(source,work,clipLength,maxClips);const result=await renderSource(source,clips,work,metadata);return{...result,clips,analysis:"audio-activity"}}finally{await rm(work,{recursive:true,force:true}).catch(()=>{})}}

const live={active:false,sourceUrl:"",work:"",child:null,timer:null,processed:new Set(),outputs:[],events:[],clipLength:45,maxClips:2,startedAt:null,lastError:null};
function liveEvent(message){live.events.unshift({time:Date.now(),message});live.events=live.events.slice(0,30)}
async function getDirectStream(sourceUrl,work){const r=await run("yt-dlp",ytArgs(["--no-playlist","-f","best","-g",sourceUrl]),work,60000);const direct=(r.out||"").split(/\r?\n/).map(x=>x.trim()).find(Boolean);if(!direct)throw new Error("yt-dlp no devolvió una URL de stream para este Live");return direct}
async function scanLive(){
  if(!live.active||!live.work)return;
  try{
    const files=(await readdir(live.work)).filter(f=>/^segment-\d+\.mp4$/i.test(f)).sort();
    for(const name of files.slice(0,-1)){
      if(live.processed.has(name))continue;live.processed.add(name);
      const source=path.join(live.work,name);const info=await stat(source);if(info.size<50000)continue;
      const clips=await audioBasedSegments(source,live.work,live.clipLength,live.maxClips);
      if(!clips.length){liveEvent("Segmento analizado sin momento exportable");continue}
      const result=await renderSource(source,clips,live.work);
      const origin=`http://${HOST==="0.0.0.0"?"127.0.0.1":HOST}:${PORT}`;
      const outs=result.outputs.map(x=>({...x,url:origin+x.file,coverUrl:origin+x.cover,thumbnails:(x.thumbnails||[]).map(t=>origin+t),live:true,created:Date.now()}));
      live.outputs.unshift(...outs);live.outputs=live.outputs.slice(0,80);liveEvent(`✨ ${outs.length} clip(s) detectados automáticamente en el Live`);
    }
  }catch(error){live.lastError=error instanceof Error?error.message:String(error);liveEvent("Error de análisis: "+live.lastError)}
}
async function stopLive(){if(live.timer){clearInterval(live.timer);live.timer=null}if(live.child){live.child.kill("SIGTERM");live.child=null}const oldWork=live.work;live.active=false;live.work="";if(oldWork)await rm(oldWork,{recursive:true,force:true}).catch(()=>{});liveEvent("Monitor Live detenido")}
async function startLive(sourceUrl,clipLength,maxClips){
  await stopLive();const work=path.join(os.tmpdir(),"cliprd-live",crypto.randomUUID());await mkdir(work,{recursive:true});
  const direct=await getDirectStream(sourceUrl,work);
  const pattern=path.join(work,"segment-%06d.mp4");
  const child=spawn("ffmpeg",["-hide_banner","-loglevel","warning","-i",direct,"-c","copy","-f","segment","-segment_time","60","-reset_timestamps","1",pattern],{cwd:work,windowsHide:true});
  let stderr="";child.stderr.on("data",d=>{stderr+=d;if(stderr.length>4000)stderr=stderr.slice(-4000)});
  child.on("error",e=>{live.lastError=e.message;liveEvent("FFmpeg: "+e.message)});
  child.on("close",code=>{if(live.active&&code!==0){live.lastError=stderr||`FFmpeg terminó con código ${code}`;liveEvent("La captura del Live se detuvo")};live.child=null});
  live.active=true;live.sourceUrl=sourceUrl;live.work=work;live.child=child;live.clipLength=clipLength;live.maxClips=maxClips;live.startedAt=Date.now();live.lastError=null;live.processed=new Set();live.outputs=[];live.events=[];liveEvent("🟢 Live conectado. Capturando segmentos de 60 segundos…");live.timer=setInterval(scanLive,12000);setTimeout(scanLive,15000);
  return {active:true};
}
function liveStatus(){return{active:live.active,sourceUrl:live.sourceUrl,startedAt:live.startedAt,outputs:live.outputs,events:live.events,lastError:live.lastError,processedSegments:live.processed.size}}

const server=http.createServer(async(req,res)=>{try{
  if(req.method==="OPTIONS"){res.writeHead(204,cors());return res.end()}
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(req.method==="GET"&&url.pathname==="/health"){const dependencies=await dependencyStatus();const ok=Boolean(dependencies.ytDlp&&dependencies.ffmpeg)&&dependencies.cookieFile!=="missing";return json(res,ok?200:503,{ok,service:"CLIPRD Local Agent",version:"2.1.0",outputDir:OUT,dependencies,features:{autoClips:"audio-activity",liveMonitor:"rolling-segments"}})}
  if(req.method==="POST"&&url.pathname==="/render"){const b=await body(req);const result=await process(safeUrl(b.sourceUrl),safeClips(b.clips));const origin=`http://${HOST==="0.0.0.0"?"127.0.0.1":HOST}:${PORT}`;result.outputs=result.outputs.map(x=>({...x,url:origin+x.file,coverUrl:origin+x.cover,thumbnails:(x.thumbnails||[]).map(t=>origin+t)}));return json(res,200,result)}
  if(req.method==="POST"&&url.pathname==="/auto-clips"){const b=await body(req),len=Math.max(10,Math.min(180,Number(b.clipLength)||45)),max=Math.max(1,Math.min(8,Number(b.maxClips)||4));const result=await autoProcess(safeUrl(b.sourceUrl),len,max);const origin=`http://${HOST==="0.0.0.0"?"127.0.0.1":HOST}:${PORT}`;result.outputs=result.outputs.map(x=>({...x,url:origin+x.file,coverUrl:origin+x.cover,thumbnails:(x.thumbnails||[]).map(t=>origin+t)}));return json(res,200,result)}
  if(req.method==="POST"&&url.pathname==="/live/start"){const b=await body(req),len=Math.max(10,Math.min(180,Number(b.clipLength)||45)),max=Math.max(1,Math.min(4,Number(b.maxClips)||2));await startLive(safeUrl(b.sourceUrl),len,max);return json(res,200,liveStatus())}
  if(req.method==="POST"&&url.pathname==="/live/stop"){await stopLive();return json(res,200,liveStatus())}
  if(req.method==="GET"&&url.pathname==="/live/status")return json(res,200,liveStatus());
  if(req.method==="GET"&&url.pathname.startsWith("/files/")){const rel=decodeURIComponent(url.pathname.slice(7)),target=path.resolve(OUT,rel);if(!target.startsWith(OUT+path.sep))return json(res,403,{error:"Ruta inválida"});const info=await stat(target);if(!info.isFile())return json(res,404,{error:"Archivo no encontrado"});res.writeHead(200,{"content-type":target.toLowerCase().endsWith(".jpg")?"image/jpeg":"video/mp4","content-length":info.size,"content-disposition":"inline","access-control-allow-origin":"*"});return createReadStream(target).pipe(res)}
  // Backward-compatible aliases for older frontend builds.
  if(req.method==="POST"&&url.pathname==="/api/auto-clips"){const b=await body(req),len=Math.max(10,Math.min(180,Number(b.clipLength)||45)),max=Math.max(1,Math.min(8,Number(b.maxClips)||4));const result=await autoProcess(safeUrl(b.sourceUrl),len,max);const origin=`http://${HOST==="0.0.0.0"?"127.0.0.1":HOST}:${PORT}`;result.outputs=result.outputs.map(x=>({...x,url:origin+x.file,coverUrl:origin+x.cover,thumbnails:(x.thumbnails||[]).map(t=>origin+t)}));return json(res,200,result)}
  return json(res,404,{error:"Not found",path:url.pathname,service:"CLIPRD Local Agent"});
}catch(error){return json(res,400,{error:error instanceof Error?error.message:String(error)})}});
server.listen(PORT,HOST,()=>console.log(`CLIPRD Local Agent v2.1.0 listo en http://${HOST}:${PORT}`));