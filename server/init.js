/**
 * Script de Inicialización Protegido
 * Crea la estructura de la base de datos si no existe.
 * NO contiene datos semilla para evitar sobrescribir el trabajo del usuario.
 */
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = require('./db');

// Crear tablas si no existen (Preserva siempre los datos actuales)
console.log('🛡️ Verificando integridad de la base de datos...');

db.exec(`
  CREATE TABLE IF NOT EXISTS mesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE NOT NULL,
    estado TEXT DEFAULT 'disponible' CHECK(estado IN ('disponible', 'ocupada', 'por_cobrar')),
    sector TEXT DEFAULT 'Adentro' CHECK(sector IN ('Adentro', 'Patio', 'Deck (Calle)')),
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    icono TEXT,
    orden INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    imagen_url TEXT,
    categoria_id INTEGER REFERENCES categorias(id),
    disponible INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mesa_id INTEGER REFERENCES mesas(id),
    estado TEXT DEFAULT 'recibido' CHECK(estado IN ('recibido', 'en_preparacion', 'listo', 'entregado')),
    notas TEXT,
    total REAL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    notas TEXT
  );

  CREATE TABLE IF NOT EXISTS historial_pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mesa_numero INTEGER NOT NULL,
    pedido_original_id INTEGER,
    detalle TEXT NOT NULL,
    total REAL NOT NULL,
    cerrado_at DATETIME DEFAULT (datetime('now', 'localtime')),
    metodo_pago TEXT,
    procesado INTEGER DEFAULT 0
  );
`);

// Migracion: agregar columna 'procesado' si ya existe la tabla sin ella
try {
  db.exec(`ALTER TABLE historial_pedidos ADD COLUMN procesado INTEGER DEFAULT 0`);
  console.log('Migracion: columna procesado agregada a historial_pedidos');
} catch (e) {
  // La columna ya existe, ignorar error
}

console.log('✅ Estructura de base de datos lista. Los datos manuales del administrador están protegidos.');
