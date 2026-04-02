import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Simple password check via query param
  const { pwd } = req.query;
  if (pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const keys = await kv.keys('suggestion:*');
    const suggestions = await Promise.all(keys.map(k => kv.get(k)));
    const valid = suggestions
      .filter(Boolean)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.status(200).json(valid);
  } catch (err) {
    console.error('suggestions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
