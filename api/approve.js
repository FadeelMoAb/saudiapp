// api/approve.js
// POST approve a suggestion — copies to phrases, marks as approved

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    // Get the suggestion
    const getRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/suggestions?id=eq.${id}&select=*`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
        },
      }
    );
    const [suggestion] = await getRes.json();
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    // Insert into phrases table
    const insertRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/phrases`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          arabic: suggestion.arabic,
          pronunciation: suggestion.pronunciation,
          english: suggestion.english,
          tags: suggestion.tags,
        }),
      }
    );
    if (!insertRes.ok) throw new Error(await insertRes.text());

    // Mark suggestion as approved
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/suggestions?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      }
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('approve error:', err);
    return res.status(500).json({ error: err.message });
  }
}
