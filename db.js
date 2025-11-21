// db.js — Vercel friendly sqlite wrapper
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// When deploying on Vercel use /tmp (writable at runtime)
const USE_TMP = !!process.env.VERCEL; // true on Vercel
const dbPath = process.env.DB_FILE || (USE_TMP ? path.join('/tmp', 'tinylink.db') : path.join(__dirname, 'data', 'tinylink.db'));

// Ensure data dir exists for local dev
if (!USE_TMP) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// If project has a packaged DB in ./data (for demo), copy it to /tmp on cold start
async function ensurePackagedDb() {
  if (!USE_TMP) return;
  try {
    const packaged = path.join(__dirname, 'data', 'tinylink.db');
    if (fs.existsSync(packaged) && !fs.existsSync(dbPath)) {
      fs.copyFileSync(packaged, dbPath);
    }
  } catch (e) {
    // ignore copy errors
  }
}

let dbPromise = null;

async function init() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    await ensurePackagedDb();
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        code TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        clicks INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_clicked TEXT,
        deleted INTEGER NOT NULL DEFAULT 0
      );
    `);

    return db;
  })();

  return dbPromise;
}

async function createLink(code, url) {
  const db = await init();
  return db.run(
    `INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)`,
    [code, url, new Date().toISOString()]
  );
}

async function getLink(code) {
  const db = await init();
  return db.get(
    `SELECT code, url, clicks, created_at, last_clicked FROM links WHERE code = ? AND deleted = 0`,
    [code]
  );
}

async function listLinks() {
  const db = await init();
  return db.all(
    `SELECT code, url, clicks, created_at, last_clicked FROM links WHERE deleted = 0 ORDER BY created_at DESC`
  );
}

async function deleteLink(code) {
  const db = await init();
  return db.run(`UPDATE links SET deleted = 1 WHERE code = ?`, [code]);
}

async function incrementClicks(code) {
  const db = await init();
  return db.run(
    `UPDATE links SET clicks = clicks + 1, last_clicked = ? WHERE code = ?`,
    [new Date().toISOString(), code]
  );
}

module.exports = {
  init,
  createLink,
  getLink,
  listLinks,
  deleteLink,
  incrementClicks
};
