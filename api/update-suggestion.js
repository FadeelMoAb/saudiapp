import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, ar, pr, en, tags } = req.body;
  if (!id || !ar || !en) return res.status(400).json({ error: 'id, ar, en are required' });

  const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || 'greet');

  const { error } = await supabaseAdmin
    .from('suggestions')
    .update({ arabic: ar, pronunciation: pr || '', english: en, tags: tagsStr })
    .eq('id', id)
    .eq('status', 'pending');

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
