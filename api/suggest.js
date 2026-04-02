import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ar, pr, en, tags } = req.body;
  if (!ar || !en) return res.status(400).json({ error: 'Missing fields' });

  // Fuzzy normalize Arabic for duplicate check
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

  try {
    // Check for duplicates among pending suggestions
    const keys = await kv.keys('suggestion:*');
    for (const key of keys) {
      const existing = await kv.get(key);
      if (existing && normalizeAr(existing.ar) === normalizeAr(ar)) {
        return res.status(409).json({ error: 'duplicate' });
      }
    }

    // Save suggestion with unique ID
    const id = `suggestion:${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    await kv.set(id, {
      id,
      ar: ar.trim(),
      pr: pr?.trim() || '',
      en: en.trim(),
      tags: Array.isArray(tags) ? tags : ['greet'],
      submittedAt: new Date().toISOString(),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('suggest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
