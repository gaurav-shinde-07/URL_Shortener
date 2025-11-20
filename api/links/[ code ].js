    const db = require('../../db');

module.exports = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    // ---- GET /api/links/:code (fetch one) ----
    if (req.method === 'GET') {
      const row = await db.getLink(code);
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.json(row);
    }

    // ---- DELETE /api/links/:code (soft delete) ----
    if (req.method === 'DELETE') {
      await db.deleteLink(code);
      return res.json({ ok: true });
    }

    // Otherwise invalid method
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('ERROR in /api/links/[code]:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
