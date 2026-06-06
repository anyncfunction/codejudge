const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/oj.db');
let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function getSafeDb() {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  return db;
}

function queryAll(sql, params = []) {
  const d = getSafeDb();
  const stmt = d.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

function run(sql, params = []) {
  const d = getSafeDb();
  d.run(sql, params);
  saveDb();
  const r = d.exec('SELECT last_insert_rowid()');
  return { lastInsertRowid: r[0]?.values[0]?.[0] };
}

function exec(sql) {
  const d = getSafeDb();
  d.run(sql);
  saveDb();
}

module.exports = { getDb, getSafeDb, saveDb, queryAll, queryOne, run, exec };
