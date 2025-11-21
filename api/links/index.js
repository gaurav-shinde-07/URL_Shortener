const db = require('../../db');

module.exports = async (req, res) => {
  try {
    // POST /api/links (create)
    if (req.method === 'POST') {
      const { url, code } = req.body || {};
      if (!url) return res.status(400).json({ error: 'Missing url' });

      // Validate URL (simple)
      try {
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
      } catch {
        return res.status(400).json({ error: 'Invalid URL' });
      }

      // Validate or generate code
      let finalCode = code?.trim();
      const re = /^[A-Za-z0-9]{4,32}$/;

      if (finalCode) {
        if (!re.test(finalCode)) return res.status(400).json({ error: 'Invalid code format' });
        const exists = await db.getLink(finalCode);
        if (exists) return res.status(409).json({ error: 'Code already exists' });
      } else {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let exists;
        do {
          finalCode = Array.from({ length: 6 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
          exists = await db.getLink(finalCode);
        } while (exists);
      }

      await db.createLink(finalCode, url);

      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || '';
      const shortUrl = `${proto}://${host}/${finalCode}`;

      return res.status(201).json({ code: finalCode, url, shortUrl });
    }

    // GET /api/links (list)
    if (req.method === 'GET') {
      const rows = await db.listLinks();
      return res.json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('ERROR /api/links:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
