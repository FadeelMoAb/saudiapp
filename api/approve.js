// api/approve.js
// POST approve a suggestion — copies to phrases with edited fields, marks as approved

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pwd, id, ar, pr, en, tags } = req.body;
  if (pwd !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!id) return res.status(400).json({ error: 'id required' });

  const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || 'greet');

  try {
    // Insert into phrases table with admin-edited fields
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
        body: JSON.stringify({ arabic: ar, pronunciation: pr || '', english: en, tags: tagsStr }),
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
