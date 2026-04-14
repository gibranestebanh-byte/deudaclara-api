export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, nombre, resumen, deudas } = req.body;

    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const fmt = (n) => n ? '$' + Math.round(n).toLocaleString('es-MX') : '$0';

    const deudasHtml = (deudas || []).map(d => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:14px">${d.acreedor}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:14px">${d.tipo || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:14px;font-weight:600">${fmt(d.saldo_total)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;font-size:14px;color:${d.estatus === 'Atrasado' ? '#DC2626' : '#1A8754'}">${d.estatus}</td>
      </tr>
    `).join('');

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1A56A0,#2E86DE);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.5px">DeudaClara</div>
      <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:4px">Tu análisis de Buró de Crédito</div>
    </div>

    <!-- BODY -->
    <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(26,86,160,0.1)">

      <p style="font-size:16px;color:#0F2744;margin-bottom:24px">
        Hola <strong>${nombre || 'usuario'}</strong>, aquí está tu análisis completo de Buró de Crédito:
      </p>

      <!-- RESUMEN -->
      <div style="background:#F0F4F8;border-radius:12px;padding:20px;margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:#1A56A0;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Resumen de tu situación</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="background:white;border-radius:8px;padding:14px;text-align:center">
            <div style="font-size:11px;color:#5A7A9F;text-transform:uppercase;letter-spacing:0.5px">Deuda Total</div>
            <div style="font-size:22px;font-weight:700;color:#DC2626;margin-top:4px">${fmt(resumen?.deuda_total)}</div>
          </div>
          <div style="background:white;border-radius:8px;padding:14px;text-align:center">
            <div style="font-size:11px;color:#5A7A9F;text-transform:uppercase;letter-spacing:0.5px">Monto Atrasado</div>
            <div style="font-size:22px;font-weight:700;color:#D97706;margin-top:4px">${fmt(resumen?.deuda_atrasada)}</div>
          </div>
          <div style="background:white;border-radius:8px;padding:14px;text-align:center">
            <div style="font-size:11px;color:#5A7A9F;text-transform:uppercase;letter-spacing:0.5px">Al Corriente</div>
            <div style="font-size:22px;font-weight:700;color:#1A8754;margin-top:4px">${fmt(resumen?.deuda_corriente)}</div>
          </div>
          <div style="background:white;border-radius:8px;padding:14px;text-align:center">
            <div style="font-size:11px;color:#5A7A9F;text-transform:uppercase;letter-spacing:0.5px">Núm. Créditos</div>
            <div style="font-size:22px;font-weight:700;color:#1A56A0;margin-top:4px">${resumen?.num_creditos || 0}</div>
          </div>
        </div>
      </div>

      <!-- DEUDAS -->
      <div style="font-size:13px;font-weight:700;color:#1A56A0;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Detalle de tus deudas</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#1A56A0">
            <th style="padding:10px 12px;text-align:left;color:white;font-size:12px;font-weight:600">Acreedor</th>
            <th style="padding:10px 12px;text-align:left;color:white;font-size:12px;font-weight:600">Tipo</th>
            <th style="padding:10px 12px;text-align:left;color:white;font-size:12px;font-weight:600">Saldo</th>
            <th style="padding:10px 12px;text-align:left;color:white;font-size:12px;font-weight:600">Estatus</th>
          </tr>
        </thead>
        <tbody>${deudasHtml}</tbody>
      </table>

      <!-- CTA -->
      <div style="background:linear-gradient(135deg,rgba(26,86,160,0.06),rgba(46,134,222,0.04));border:1px solid #C9DDF0;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <div style="font-size:15px;font-weight:700;color:#0F2744;margin-bottom:8px">¿Listo para negociar tus deudas?</div>
        <div style="font-size:13px;color:#5A7A9F;margin-bottom:16px">Obtén tu plan de quita personalizado y guía de negociación completa.</div>
        <a href="https://deudaclara.mx" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#1A56A0,#2E86DE);color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700">
          Ver mi Plan de Quita →
        </a>
      </div>

      <!-- FOOTER -->
      <div style="text-align:center;font-size:12px;color:#5A7A9F;border-top:1px solid #E5E7EB;padding-top:16px">
        🔒 Tu información es privada y no se comparte con terceros.<br>
        <a href="https://deudaclara.mx" style="color:#1A56A0;text-decoration:none">deudaclara.mx</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'DeudaClara <analisis@deudaclara.mx>',
        to: [email],
        subject: '📊 Tu análisis de Buró de Crédito — DeudaClara',
        html: htmlBody
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('Resend error:', JSON.stringify(data));
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.log('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
