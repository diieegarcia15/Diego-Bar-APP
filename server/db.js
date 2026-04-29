/**
 * Conexión a Base de Datos SQLite
 * Usa better-sqlite3 para operaciones síncronas y de alta velocidad.
 * El archivo de la DB se crea automáticamente en /server/data/restaurante.db
 */
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'data', 'restaurante.db');

// Crear directorio data si no existe
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Habilitar WAL mode para mejor rendimiento concurrente
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
