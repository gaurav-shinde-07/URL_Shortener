const db = require('../db');

module.exports = async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) return res.status(400).send('Missing code');

    const row = await db.getLink(code);
    if (!row) return res.status(404).send('Not found');

    // increment click count
    await db.incrementClicks(code);

    res.writeHead(302, { Location: row.url });
    res.end();

  } catch (err) {
    console.error('REDIRECT ERROR:', err);
    res.status(500).send('Server Error');
  }
};
