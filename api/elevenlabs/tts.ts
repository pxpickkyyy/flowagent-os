export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = (process.env.ELEVENLABS_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    res.status(503).json({ success: false, error: 'ELEVENLABS_API_KEY not configured, fallback to Web Speech' });
    return;
  }

  try {
    const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body || {};
    if (!text) {
      res.status(400).json({ success: false, error: 'Missing text parameter' });
      return;
    }

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      res.status(elevenRes.status).json({ success: false, error: errText });
      return;
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    res.status(200).json({
      success: true,
      audioUrl,
      format: 'audio/mpeg',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'TTS generation exception' });
  }
}
