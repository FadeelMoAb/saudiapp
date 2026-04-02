import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pwd, id } = req.body;
  if (pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    await kv.del(id);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('reject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
