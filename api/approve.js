export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pwd, id, ar, pr, en, tags } = req.body;
  if (pwd !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!id || !ar || !en) return res.status(400).json({ error: 'Missing fields' });

  const KV_URL    = process.env.KV_REST_API_URL;
  const KV_TOKEN  = process.env.KV_REST_API_TOKEN;
  const scriptUrl = process.env.SUGGESTIONS_SHEET_SCRIPT_URL;

  if (!scriptUrl) return res.status(500).json({ error: 'Sheet script URL not configured' });

  try {
    // Push to Google Sheet via Apps Script
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ar: ar.trim(),
        pr: (pr||'').trim(),
        en: en.trim(),
        tags: Array.isArray(tags) ? tags.join(',') : tags,
      }),
      redirect: 'follow',
    });

    // Delete from KV
    await fetch(`${KV_URL}/del/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('approve error:', err);
    res.status(500).json({ error: err.message });
  }
}
