import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pwd, id } = req.body;
  if (pwd !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!id) return res.status(400).json({ error: 'id required' });

  const { error } = await supabaseAdmin
    .from('suggestions')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
