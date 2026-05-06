// api/suggestions.js
// GET all pending suggestions (admin only)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/suggestions?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);

    const suggestions = await response.json();
    return res.status(200).json(suggestions);

  } catch (err) {
    console.error('suggestions fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
}
