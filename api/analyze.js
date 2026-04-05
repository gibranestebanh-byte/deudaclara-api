export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'DeudaClara API funcionando correctamente' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log what we receive for debugging
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Body type:', typeof req.body);

    const body = req.body;

    if (!body) {
      return res.status(400).json({ error: 'No body received' });
    }

    const pdf_base64 = body.pdf_base64;
    const prompt = body.prompt;

    if (!pdf_base64) {
      return res.status(400).json({ error: 'Missing pdf_base64', received_keys: Object.keys(body) });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt', received_keys: Object.keys(body) });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en Vercel' });
    }

    console.log('pdf_base64 length:', pdf_base64.length);
    console.log('Calling Anthropic API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdf_base64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });

    const data = await response.json();
    console.log('Anthropic response status:', response.status);

    if (!response.ok) {
      console.log('Anthropic error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.log('Server error:', err.message);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
