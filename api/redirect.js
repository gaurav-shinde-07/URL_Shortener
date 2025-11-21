import db from '../../db';

export default async function handler(req, res) {
  const { code } = req.query;

  const row = await db.getLink(code);
  if (!row) return res.status(404).send("Not found");

  await db.incrementClicks(code);

  return res.redirect(row.url);
}
