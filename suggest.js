// api/suggest.js
// POST a new phrase suggestion — checks duplicates, inserts to Supabase

function normalizeAr(str) {
  return str
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove diacritics
    .replace(/\u0640/g, '')                  // remove tatweel
    .replace(/[إأآا]/g, 'ا')               // normalize alef
    .replace(/ى/g, 'ي')                     // alef maqsura → ya
    .replace(/ة/g, 'ه')                     // taa marbuta → ha
    .replace(/[^\u0621-\u064A]/g, '')        // keep Arabic only
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ar, pr, en, tags } = req.body;

  if (!ar || !en) {
    return res.status(400).json({ error: 'Arabic and English are required' });
  }

  const normNew = normalizeAr(ar);

  try {
    // Fetch all existing phrases to check duplicates
    const phrasesRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/phrases?select=arabic`,
      {
        headers: {
          'apikey': process.env.SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    const phrases = await phrasesRes.json();

    // Also check pending suggestions
    const suggestionsRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/suggestions?select=arabic&status=eq.pending`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SECRET_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
        },
      }
    );
    const suggestions = await suggestionsRes.json();

    const allArabic = [
      ...phrases.map(p => p.arabic),
      ...suggestions.map(s => s.arabic),
    ];

    // Level 1 & 2: exact + normalized match
    for (const existing of allArabic) {
      if (normalizeAr(existing) === normNew) {
        return res.status(409).json({
          error: 'duplicate',
          message: 'This phrase already exists in the library.',
          similar: existing,
        });
      }
    }

    // Level 3: fuzzy match (typos)
    for (const existing of allArabic) {
      const sim = similarity(normNew, normalizeAr(existing));
      if (sim >= 0.8) {
        return res.status(409).json({
          error: 'similar',
          message: 'This looks very similar to an existing phrase.',
          similar: existing,
          similarity: Math.round(sim * 100),
        });
      }
    }

    // All clear — insert to suggestions table
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || 'greet');

    const insertRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/suggestions`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          arabic: ar,
          pronunciation: pr || '',
          english: en,
          tags: tagsStr,
          status: 'pending',
        }),
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(err);
    }

    const inserted = await insertRes.json();
    return res.status(200).json({ success: true, id: inserted[0]?.id });

  } catch (err) {
    console.error('suggest error:', err);
    return res.status(500).json({ error: err.message });
  }
}
