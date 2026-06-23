const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize Tables
db.serialize(() => {
  // Reports Table
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    citizenName TEXT,
    aiCategory TEXT,
    aiPriorityScore INTEGER,
    status TEXT,
    date TEXT,
    originalComplaint TEXT,
    preview TEXT,
    expiresAt INTEGER,
    lastActivityAt INTEGER
  )`);

  // Pastikan kolom lastActivityAt ada pada database lama
  db.run(`ALTER TABLE reports ADD COLUMN lastActivityAt INTEGER`, () => {});

  // Messages Table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    reportId TEXT,
    sender TEXT,
    text TEXT,
    timestamp TEXT,
    status TEXT,
    FOREIGN KEY(reportId) REFERENCES reports(id) ON DELETE CASCADE
  )`);

  // Attachments Table
  db.run(`CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    messageId TEXT,
    reportId TEXT,
    name TEXT,
    url TEXT,
    type TEXT,
    size INTEGER,
    FOREIGN KEY(messageId) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY(reportId) REFERENCES reports(id) ON DELETE CASCADE
  )`);
});

// Helper functions (Promisified for easier async/await usage in express)
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = { db, dbRun, dbGet, dbAll };
