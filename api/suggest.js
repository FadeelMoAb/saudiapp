import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

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

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ar, pr, en, tags } = req.body;
  if (!ar || !en) return res.status(400).json({ error: 'Arabic and English are required' });

  const normNew = normalizeAr(ar);

  try {
    // Fetch existing phrases
    const { data: phrases } = await supabase.from('phrases').select('arabic');
    // Fetch existing pending suggestions
    const { data: suggestions } = await supabaseAdmin
      .from('suggestions')
      .select('arabic')
      .eq('status', 'pending');

    const allArabic = [
      ...(phrases || []).map(p => p.arabic),
      ...(suggestions || []).map(s => s.arabic),
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

    // Level 3: fuzzy match
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

    // Insert suggestion
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || 'greet');
    const { data, error } = await supabaseAdmin.from('suggestions').insert({
      arabic: ar,
      pronunciation: pr || '',
      english: en,
      tags: tagsStr,
      status: 'pending',
    }).select();

    if (error) throw new Error(error.message);
    return res.status(200).json({ success: true, id: data[0]?.id });

  } catch (err) {
    console.error('suggest error:', err);
    return res.status(500).json({ error: err.message });
  }
}
