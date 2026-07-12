import express from 'express';

const app = express();
app.use(express.json());

const PIXEL_ID     = process.env.PIXEL_ID     || '1263049232641635';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'EAAVEbJhc5dQBR9ZAXi7ACkiv8cgEy7Qbf4s0z74tGfDtuTQjYNr2KPsMQIEZC82YowRQ6JNI6DdxsAS1Ko90T8YZC3UC1jbFG9C8IZCFPgeTM24EtmZAlPDNG2Fy0jC9oPmeQjq2vAaUGJZBnyk0LhWnL1z3WlSIApxyLuu8HXNAFI5wD8Nk9ZAZCml4ecCcoZCkh7QZDZD';
const CAPI_URL     = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/lead', async (req, res) => {
  const { fbp, fbc, userAgent, eventId, ip } = req.body;

  const userData = { client_user_agent: userAgent || '' };
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const clientIp = ip || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  if (clientIp && clientIp !== '::1') userData.client_ip_address = clientIp;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId || `tg_${Date.now()}`,
      event_source_url: req.headers.referer || '',
      action_source: 'website',
      user_data: userData,
    }],
  };

  try {
    const response = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.json({ ok: true, capi: data });
  } catch (err) {
    console.error('CAPI error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`track-telegram running on port ${PORT}`));