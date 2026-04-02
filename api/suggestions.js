export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pwd } = req.query;
  if (pwd !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  async function kvGet(key) {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const d = await r.json();
    return d.result ? JSON.parse(d.result) : null;
  }

  async function kvKeys(prefix) {
    const r = await fetch(`${KV_URL}/keys/${encodeURIComponent(prefix + '*')}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const d = await r.json();
    return d.result || [];
  }

  try {
    const keys = await kvKeys('suggestion:');
    const items = await Promise.all(keys.map(k => kvGet(k)));
    const valid = items.filter(Boolean).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.status(200).json(valid);
  } catch (err) {
    console.error('suggestions error:', err);
    res.status(500).json({ error: err.message });
  }
}
