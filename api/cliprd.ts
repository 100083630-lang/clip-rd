import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Crear un Job nuevo
  if (req.method === 'POST') {
    const { video_url, title, user_id } = req.body;

    if (!video_url) {
      return res.status(400).json({ error: 'Falta video_url' });
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        video_url,
        title: title || 'Clip sin titulo',
        user_id: user_id || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true, job: data });
  }

  // Ver los Jobs de un usuario
  if (req.method === 'GET') {
    const { user_id } = req.query;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ ok: true, jobs: data });
  }

  return res.status(405).json({ error: 'Metodo no permitido' });
}
