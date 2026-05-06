// api/phrases.js
// GET all approved phrases from Supabase

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/phrases?select=*&order=id.asc`,
      {
        headers: {
          'apikey': process.env.SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const phrases = await response.json();

    // Format to match what the frontend expects
    const formatted = phrases.map(p => ({
      ar: p.arabic,
      pr: p.pronunciation || '',
      en: p.english,
      tags: p.tags ? p.tags.split(',').map(t => t.trim()) : ['greet'],
      id: p.id,
    }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(formatted);

  } catch (err) {
    console.error('phrases fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
}
