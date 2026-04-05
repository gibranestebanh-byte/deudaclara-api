export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;

    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado' });
    }

    // Create MercadoPago preference
    const preference = {
      items: [{
        id: 'deudaclara-pro',
        title: 'DeudaClara Plan Pro — Análisis completo de Buró',
        description: 'Radiografía de deudas, plan de quita, simulador y guía de negociación personalizada',
        quantity: 1,
        currency_id: 'MXN',
        unit_price: 149
      }],
      payer: {
        email: email || 'cliente@deudaclara.mx'
      },
      back_urls: {
        success: 'https://deudaclara.mx?pago=exitoso',
        failure: 'https://deudaclara.mx?pago=fallido',
        pending: 'https://deudaclara.mx?pago=pendiente'
      },
      auto_return: 'approved',
      statement_descriptor: 'DEUDACLARA',
      external_reference: `dc_${Date.now()}`,
      expires: false
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('MP error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({
      preference_id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point
    });

  } catch (err) {
    console.log('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
