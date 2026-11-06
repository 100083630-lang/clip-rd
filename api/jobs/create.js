export default async function handler(req,res){
 if(req.method==="GET")return res.status(200).json({ok:true,worker:"cliprd-video-worker",note:"Connect a real FFmpeg-capable worker service for rendering."});
 if(req.method!=="POST")return res.status(405).end();
 const b=req.body||{};
 if(!b.project_id)return res.status(400).json({error:"Falta project_id"});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return res.status(503).json({error:"Supabase no configurado"});
 const h={apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"};
 try{
  const job={project_id:b.project_id,type:b.type||"analyze",status:"queued",progress:0,payload:{source:b.source||"authorized-upload",preset:b.preset||"short-vertical"}};
  const r=await fetch(base+"/rest/v1/cliprd_jobs",{method:"POST",headers:{...h,Prefer:"return=representation"},body:JSON.stringify(job)});
  const d=await r.json();if(!r.ok)throw new Error(d.message||"No se pudo crear el trabajo");
  return res.status(202).json({job:d[0],next:"Dispatch this job to a dedicated FFmpeg worker"});
 }catch(e){return res.status(500).json({error:e.message})}
}