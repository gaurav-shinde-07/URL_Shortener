require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Health check
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: "1.0", timestamp: new Date().toISOString() });
});

// Create short link
app.post('/api/links', async (req, res) => {
  const { url, code } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing 'url'" });

  // Validate URL
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  let finalCode = code?.trim();
  const re = /^[A-Za-z0-9]{6,8}$/;

  // If custom code is provided
  if (finalCode) {
    if (!re.test(finalCode)) {
      return res.status(400).json({ error: "Invalid code format" });
    }

    const exists = await db.getLink(finalCode);
    if (exists) return res.status(409).json({ error: "Code exists" });

  } else {
    // Auto-generate code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let found = null;
    do {
      finalCode = Array.from({ length: 7 })
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join('');
      found = await db.getLink(finalCode);
    } while (found);
  }

  await db.createLink(finalCode, url);

  res.status(201).json({
    code: finalCode,
    shortUrl: `${BASE_URL}/${finalCode}`,
    url
  });
});

// List links
app.get('/api/links', async (req, res) => {
  const rows = await db.listLinks();
  res.json(rows);
});

// Get link details
app.get('/api/links/:code', async (req, res) => {
  const row = await db.getLink(req.params.code);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

// Delete link
app.delete('/api/links/:code', async (req, res) => {
  const row = await db.getLink(req.params.code);
  if (!row) return res.status(404).json({ error: "Not found" });

  await db.deleteLink(req.params.code);
  res.json({ ok: true });
});

// Serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// Redirect handler
app.get('/:code', async (req, res) => {
  const row = await db.getLink(req.params.code);
  if (!row) return res.status(404).send('Not found');

  await db.incrementClicks(req.params.code);
  res.redirect(302, row.url);
});

// Initialize DB then start server
const start = async () => {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`TinyLink listening on ${PORT} - base url ${BASE_URL}`);
    });
  } catch (err) {
    console.error('Failed to initialize DB', err);
    process.exit(1);
  }
};

start();
