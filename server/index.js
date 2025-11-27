require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!MP_ACCESS_TOKEN) {
  console.warn('WARNING: MP_ACCESS_TOKEN not set. Set it in server/.env or in env before starting.');
}

app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Mivok Mercado Pago microserver' });
});

app.post('/create_preference', async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'MP_ACCESS_TOKEN not configured' });

    const { items, payer, back_urls, binary_mode, auto_return } = req.body;

    const body = {
      items: items || [
        { id: '1234', title: 'Servicio Mivok', quantity: 1, currency_id: 'CLP', unit_price: 1000 }
      ],
      payer: payer || { email: 'test_user@example.com' },
      binary_mode: typeof binary_mode === 'boolean' ? binary_mode : false,
      back_urls: back_urls || {
        success: 'https://www.google.com',
        failure: 'https://www.google.com',
        pending: 'https://www.google.com'
      },
      auto_return: auto_return || 'approved'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Mercado Pago error', details: data });
    }

    // Devuelve directamente la data para que el cliente abra init_point / sandbox_init_point
    return res.json(data);
  } catch (err) {
    console.error('Server create_preference error:', err);
    return res.status(500).json({ error: 'internal_server_error', details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Mivok MP microserver listening on http://localhost:${PORT}`);
});
