// db.js — async sqlite implementation (uses sqlite + sqlite3)
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = process.env.DB_FILE || path.join(__dirname, 'data', 'tinylink.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// We'll export an object with async init and functions
let db;

async function init() {
  if (db) return db;
  db = await open({
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
}

async function createLink(code, url) {
  await init();
  return db.run(
    `INSERT INTO links (code, url, created_at) VALUES (?, ?, ?)`,
    [code, url, new Date().toISOString()]
  );
}

async function getLink(code) {
  await init();
  return db.get(
    `SELECT code, url, clicks, created_at, last_clicked FROM links WHERE code = ? AND deleted = 0`,
    [code]
  );
}

async function listLinks() {
  await init();
  return db.all(
    `SELECT code, url, clicks, created_at, last_clicked FROM links WHERE deleted = 0 ORDER BY created_at DESC`
  );
}

async function deleteLink(code) {
  await init();
  return db.run(`UPDATE links SET deleted = 1 WHERE code = ?`, [code]);
}

async function incrementClicks(code) {
  await init();
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
