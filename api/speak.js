export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice_id } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const voiceId = voice_id || process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return res.status(500).json({ error: 'ElevenLabs not configured. Add ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID to Vercel environment variables.' });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2', // best Arabic support
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    // Stream the audio back to the client
    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h — same text = same audio
    res.send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error('ElevenLabs error:', err);
    res.status(500).json({ error: 'Failed to fetch audio' });
  }
}
