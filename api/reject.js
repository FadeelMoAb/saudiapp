// api/reject.js
// POST reject a suggestion (admin only)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { pwd, id } = req.body;
  if (pwd !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/suggestions?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      }
    );
    if (!response.ok) throw new Error(await response.text());
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('reject error:', err);
    return res.status(500).json({ error: err.message });
  }
}
