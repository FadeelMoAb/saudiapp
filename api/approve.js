import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pwd, id, ar, pr, en, tags } = req.body;
  if (pwd !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!id) return res.status(400).json({ error: 'id required' });

  const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || 'greet');

  // Insert into phrases
  const { error: insertError } = await supabaseAdmin.from('phrases').insert({
    arabic: ar,
    pronunciation: pr || '',
    english: en,
    tags: tagsStr,
  });
  if (insertError) return res.status(500).json({ error: insertError.message });

  // Mark suggestion as approved
  const { error: updateError } = await supabaseAdmin
    .from('suggestions')
    .update({ status: 'approved' })
    .eq('id', id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.status(200).json({ success: true });
}
