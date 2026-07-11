/**
 * Conexin a Base de Datos - Multi-motor (SQLite/PostgreSQL)
 */
const { Pool, types } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configurar parsers para que PostgreSQL devuelva nmeros en vez de strings
// OID 1700 es NUMERIC, OID 20 es INT8 (BIGINT)
types.setTypeParser(1700, val => parseFloat(val));
types.setTypeParser(20, val => parseInt(val, 10));

let db;
const isProd = !!process.env.DATABASE_URL;

if (isProd) {
  // SSL: por defecto verificamos el certificado (seguro).
  // Algunos proveedores como Render free tier usan certs autofirmados —
  // en ese caso, setear DB_SSL_REJECT_UNAUTHORIZED=false en el .env de producción.
  const sslConfig = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
    ? { rejectUnauthorized: false }   // Proveedor con cert autofirmado (Render, etc.)
    : true;                            // Verificar certificado (comportamiento seguro por defecto)

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
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
  const DB_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const DB_PATH = path.join(DB_DIR, 'restaurante.db');
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
    // Mtodo para transacciones o exec directo si fuera necesario
    exec(sql) { sqlite.exec(sql); },
    prepare(sql) { return sqlite.prepare(sql); }
  };
}

module.exports = db;
