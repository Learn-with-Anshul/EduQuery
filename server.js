// Express-based static server for EduQuery
// - Serves static assets from the project root
// - Applies sensible security headers via helmet
// - Provides a placeholder /api/llm-proxy endpoint (implement server-side LLM calls here)

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Prefer a dist/ folder when present (produced by the build step)
const STATIC_DIR = process.env.STATIC_DIR || (fs.existsSync(path.join(ROOT, 'dist')) ? path.join(ROOT, 'dist') : ROOT);

const app = express();

// Middlewares
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, // CSP can be added/configured separately — configure before production
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));

// Serve static files (the app is a static SPA)
app.use(express.static(STATIC_DIR, {
  extensions: ['html'],
  index: 'index.html',
  setHeaders: (res, filePath) => {
    // Basic caching for static assets (fingerprinting recommended for long-term caching)
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

console.log('Serving static files from', STATIC_DIR);


// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Rate limiter for LLM proxy
const llmLimiter = rateLimit({
  windowMs: parseInt(process.env.LLM_RATE_WINDOW_MS) || 60 * 1000, // default 1 minute
  max: parseInt(process.env.LLM_RATE_MAX) || 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Simple token-based auth middleware for proxy
function requireProxyAuth(req, res, next) {
  const token = process.env.PROXY_API_TOKEN;
  if (!token) {
    console.warn('PROXY_API_TOKEN not set - blocking proxy access');
    return res.status(500).json({ error: 'Server proxy not configured. Set PROXY_API_TOKEN in environment.' });
  }

  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization token' });

  if (authHeader.startsWith('Bearer ')) {
    if (authHeader.slice(7) === token) return next();
  } else if (authHeader === token) {
    return next();
  }

  return res.status(403).json({ error: 'Invalid authorization token' });
}

// LLM proxy endpoint with rate limiting and auth
app.post('/api/llm-proxy', llmLimiter, requireProxyAuth, async (req, res) => {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: 'LLM proxy not configured on server. Set LLM_API_KEY in environment.' });
  }

  const { prompt, model } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  // Support provider selection via LLM_PROVIDER env (defaults to 'hf' - Hugging Face)
  const provider = (process.env.LLM_PROVIDER || 'hf').toLowerCase();

  try {
    if (provider === 'hf') {
      // Hugging Face Inference API
      const hfToken = process.env.HF_API_TOKEN || apiKey; // allow HF token in HF_API_TOKEN or fallback to LLM_API_KEY
      if (!hfToken) return res.status(501).json({ error: 'Hugging Face API token not configured (HF_API_TOKEN)' });

      const modelName = model || process.env.HF_MODEL || process.env.GEMINI_MODEL || 'gpt2';
      const url = `https://api-inference.huggingface.co/models/${modelName}`;

      const body = {
        inputs: prompt,
        parameters: {
          max_new_tokens: parseInt(process.env.HF_MAX_TOKENS || '256'),
          temperature: parseFloat(process.env.HF_TEMPERATURE || '0.7')
        }
      };

      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hfToken}` },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const text = await r.text();
        return res.status(502).json({ error: 'LLM provider error', details: text });
      }

      const data = await r.json();
      // Response can be { generated_text: '...' } or [{ generated_text: '...' }] or plain string
      let reply = null;
      if (!data) reply = null;
      else if (typeof data === 'string') reply = data;
      else if (Array.isArray(data) && data[0] && (data[0].generated_text || data[0].summary_text)) {
        reply = data[0].generated_text || data[0].summary_text;
      } else if (data.generated_text) reply = data.generated_text;
      else reply = JSON.stringify(data);

      return res.json({ model: modelName, reply });
    }

    if (provider === 'gemini') {
      // Google Generative API (basic example using API key)
      const modelName = model || process.env.GEMINI_MODEL || 'models/text-bison-001';
      const url = `https://generativelanguage.googleapis.com/v1beta2/${modelName}:generateText?key=${apiKey}`;

      const body = {
        prompt: { text: prompt },
      };

      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!r.ok) {
        const text = await r.text();
        return res.status(502).json({ error: 'LLM provider error', details: text });
      }

      const data = await r.json();
      const reply = (data?.candidates && data.candidates[0] && data.candidates[0].content) || data?.result?.output || JSON.stringify(data);
      return res.json({ model: modelName, reply });
    }

    // Fallback: return demo reply
    return res.json({ model: model || 'demo', reply: `Demo reply for prompt: ${String(prompt).slice(0,200)}` });
  } catch (err) {
    console.error('LLM proxy error:', err);
    return res.status(500).json({ error: 'Internal LLM proxy error' });
  }
});

// SPA fallback: return index.html for any unmatched GET route (support client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(ROOT, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.status(404).send('Not Found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🎓 EduQuery (Express) is running!\n`);
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`\n  Press Ctrl+C to stop.\n`);
});
