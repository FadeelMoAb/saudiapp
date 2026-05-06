import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabase
    .from('phrases')
    .select('*')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const formatted = data.map(p => ({
    ar: p.arabic,
    pr: p.pronunciation || '',
    en: p.english,
    tags: p.tags ? p.tags.split(',').map(t => t.trim()) : ['greet'],
    id: p.id,
  }));

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  return res.status(200).json(formatted);
}
