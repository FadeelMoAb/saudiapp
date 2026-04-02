export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ar, pr, en, tags } = req.body;
  if (!ar || !en) return res.status(400).json({ error: 'Missing fields' });

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: 'KV not configured' });

  function normalizeAr(str) {
    return str
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/\u0640/g, '')
      .replace(/[إأآا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\u0621-\u064A]/g, '')
      .trim();
  }

  async function kvGet(key) {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const d = await r.json();
    if (!d.result) return null;
    if (typeof d.result === 'string') {
      try { return JSON.parse(d.result); } catch { return null; }
    }
    return d.result;
  }

  async function kvSet(key, value) {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: value })
    });
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
    for (const key of keys) {
      const existing = await kvGet(key);
      if (existing && existing.ar && normalizeAr(existing.ar) === normalizeAr(ar)) {
        return res.status(409).json({ error: 'duplicate' });
      }
    }

    const id = `suggestion:${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    await kvSet(id, {
      id,
      ar: ar.trim(),
      pr: (pr||'').trim(),
      en: en.trim(),
      tags: Array.isArray(tags) ? tags : ['greet'],
      submittedAt: new Date().toISOString(),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('suggest error:', err);
    res.status(500).json({ error: err.message });
  }
}
