const cfg=()=>({url:process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,openai:process.env.OPENAI_API_KEY});
export default async function(req,res){
 if(req.method!=="POST")return res.status(405).end();
 const{url,key,openai}=cfg(),b=req.body||{};
 if(!url||!key)return res.status(503).json({error:"Supabase no configurado"});
 if(!b.project_id)return res.status(400).json({error:"Falta project_id"});
 let score=86,hook="Inicio recomendado: entra directamente con la afirmación o conflicto más fuerte.",retention="Mantén contexto, ritmo y cambios visuales cada pocos segundos.",moments=["00:00–00:08 · gancho","00:18–00:42 · idea principal","00:43–01:00 · cierre"],recommendation="Prioriza una idea por clip y elimina silencios.";
 if(openai){
  try{
   const prompt="Analiza este título de video para convertir contenido autorizado en Shorts. Devuelve JSON con score (0-100), hook, retention, recommendation y moments (3 strings con rangos aproximados). Título: "+String(b.title||"").slice(0,500);
   const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+openai,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_ANALYSIS_MODEL||"gpt-4.1-mini",response_format:{type:"json_object"},messages:[{role:"system",content:"Eres un analista de contenido viral. No inventes acceso al video: analiza solo los metadatos proporcionados."},{role:"user",content:prompt}]})});
   const d=await r.json();const x=JSON.parse(d.choices?.[0]?.message?.content||"{}");
   if(r.ok){score=Math.max(0,Math.min(100,Number(x.score)||score));hook=x.hook||hook;retention=x.retention||retention;recommendation=x.recommendation||recommendation;moments=Array.isArray(x.moments)?x.moments:moments;}
  }catch(_){}
 }
 const item={project_id:b.project_id,hook_score:Math.min(100,score+2),emotion_score:Math.max(60,score-4),retention_score:Math.min(100,score+1),recommendation,moments,created_at:new Date().toISOString()};
 const h={apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"};
 try{
  const r=await fetch(url+"/rest/v1/cliprd_analysis",{method:"POST",headers:{...h,Prefer:"return=representation"},body:JSON.stringify(item)});const d=await r.json();if(!r.ok)throw new Error(d.message||"No se pudo guardar el análisis");
  await fetch(url+"/rest/v1/cliprd_projects?id=eq."+encodeURIComponent(b.project_id),{method:"PATCH",headers:h,body:JSON.stringify({status:"analyzed",score,updated_at:new Date().toISOString()})});
  res.status(200).json({item:{score,hook,retention,moments,recommendation,ai:Boolean(openai)}})
 }catch(e){res.status(500).json({error:e.message})}
}