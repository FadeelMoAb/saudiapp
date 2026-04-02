import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pwd, id, ar, pr, en, tags } = req.body;
  if (pwd !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!id || !ar || !en) return res.status(400).json({ error: 'Missing fields' });

  const scriptUrl = process.env.SUGGESTIONS_SHEET_SCRIPT_URL;
  if (!scriptUrl) return res.status(500).json({ error: 'Sheet script URL not configured' });

  try {
    // Push to Google Sheet via Apps Script
    const sheetRes = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ar: ar.trim(),
        pr: pr?.trim() || '',
        en: en.trim(),
        tags: Array.isArray(tags) ? tags.join(',') : tags,
      }),
    });

    if (!sheetRes.ok) {
      const err = await sheetRes.text();
      return res.status(500).json({ error: 'Sheet error: ' + err });
    }

    // Delete from KV
    await kv.del(id);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('approve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
