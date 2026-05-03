/**
 * Conexión a Base de Datos - Multi-motor (SQLite/PostgreSQL)
 */
const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;
const isProd = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProd) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  db = {
    isPostgres: true,
    async query(sql, params = []) {
      // Convert ? to $1, $2 for Postgres
      let index = 1;
      const pgSql = sql.replace(/\?/g, () => `$${index++}`);
      const res = await pool.query(pgSql, params);
      return res;
    }
  };
} else {
  const DB_PATH = path.join(__dirname, 'data', 'restaurante.db');
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  db = {
    isPostgres: false,
    sqlite, // Por si necesitamos acceso directo
    async query(sql, params = []) {
      const stmt = sqlite.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return { rows: stmt.all(params) };
      } else {
        const info = stmt.run(params);
        return { rows: [], rowCount: info.changes, lastID: info.lastInsertRowid };
      }
    },
    // Método para transacciones o exec directo si fuera necesario
    exec(sql) { sqlite.exec(sql); },
    prepare(sql) { return sqlite.prepare(sql); }
  };
}

module.exports = db;