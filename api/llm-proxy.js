// Vercel serverless function for LLM proxy
// Supports Hugging Face Inference API by default. Protect with PROXY_API_TOKEN and set HF_API_TOKEN in Vercel env vars.

module.exports = async (req, res) => {
  // Allow CORS for same origin; adjust in production if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  const proxyToken = process.env.PROXY_API_TOKEN;
  if (!proxyToken) return res.status(500).json({ error: 'Proxy token not configured on server' });
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization token' });
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (provided !== proxyToken) return res.status(403).json({ error: 'Invalid authorization token' });

  const { prompt, model } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  // Simple in-memory rate limiting (per IP) — best-effort for serverless; for production use Redis or platform quotas
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const windowMs = parseInt(process.env.LLM_RATE_WINDOW_MS || '60000', 10);
    const max = parseInt(process.env.LLM_RATE_MAX || '20', 10);
    if (!global.__eduquery_rate__) global.__eduquery_rate__ = {};
    const store = global.__eduquery_rate__;
    const now = Date.now();
    const rec = store[ip] || { ts: now, count: 0 };
    if (now - rec.ts > windowMs) {
      rec.ts = now; rec.count = 0;
    }
    rec.count += 1;
    store[ip] = rec;
    if (rec.count > max) return res.status(429).json({ error: 'Rate limit exceeded' });
  } catch (e) {
    // ignore rate-limit errors
  }

  const provider = (process.env.LLM_PROVIDER || 'hf').toLowerCase();

  try {
    if (provider === 'hf') {
      const hfToken = process.env.HF_API_TOKEN || process.env.LLM_API_KEY;
      if (!hfToken) return res.status(501).json({ error: 'Hugging Face API token not configured (HF_API_TOKEN)' });
      const modelName = model || process.env.HF_MODEL || 'gpt2';
      const url = `https://api-inference.huggingface.co/models/${modelName}`;
      const body = { inputs: prompt, parameters: { max_new_tokens: parseInt(process.env.HF_MAX_TOKENS || '256', 10), temperature: parseFloat(process.env.HF_TEMPERATURE || '0.7') } };

      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hfToken}` }, body: JSON.stringify(body) });
      if (!r.ok) {
        const text = await r.text();
        return res.status(502).json({ error: 'LLM provider error', details: text });
      }
      const data = await r.json();
      let reply = null;
      if (!data) reply = null;
      else if (typeof data === 'string') reply = data;
      else if (Array.isArray(data) && data[0] && (data[0].generated_text || data[0].summary_text)) reply = data[0].generated_text || data[0].summary_text;
      else if (data.generated_text) reply = data.generated_text;
      else reply = JSON.stringify(data);

      return res.status(200).json({ model: modelName, reply });
    }

    if (provider === 'gemini') {
      const apiKey = process.env.LLM_API_KEY;
      if (!apiKey) return res.status(501).json({ error: 'Google Generative API key not configured (LLM_API_KEY)' });
      const modelName = model || process.env.GEMINI_MODEL || 'models/text-bison-001';
      const url = `https://generativelanguage.googleapis.com/v1beta2/${modelName}:generateText?key=${apiKey}`;
      const body = { prompt: { text: prompt } };
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { const text = await r.text(); return res.status(502).json({ error: 'LLM provider error', details: text }); }
      const data = await r.json();
      const reply = (data?.candidates && data.candidates[0] && data.candidates[0].content) || data?.result?.output || JSON.stringify(data);
      return res.status(200).json({ model: modelName, reply });
    }

    return res.status(400).json({ error: 'Unsupported provider' });
  } catch (err) {
    console.error('LLM proxy error:', err);
    return res.status(500).json({ error: 'Internal LLM proxy error' });
  }
};