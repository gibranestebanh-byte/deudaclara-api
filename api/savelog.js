export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};

async function getGoogleToken() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claim = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const signingInput = `${header}.${claim}`;
  
  // Sign with private key using Web Crypto
  const privateKeyPem = credentials.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Buffer.from(privateKeyPem, 'base64');
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput)
  );

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, nombre, score, deuda_total, deuda_atrasada, num_creditos, plan, pago, acreedores } = req.body;

    const token = await getGoogleToken();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const acredoresStr = Array.isArray(acreedores) ? acreedores.join(', ') : (acreedores || '');

    const values = [[
      fecha,
      email || '—',
      nombre || '—',
      score || '—',
      deuda_total || 0,
      deuda_atrasada || 0,
      num_creditos || 0,
      plan || 'gratis',
      pago ? 'Sí' : 'No',
      acredoresStr
    ]];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log('Sheets error:', JSON.stringify(data));
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.log('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
