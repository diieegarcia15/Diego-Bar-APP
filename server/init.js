/**
 * Script de Inicialización - Compatible con SQLite y PostgreSQL
 */
const db = require('./db');

async function init() {
  console.log('🛡️ Verificando integridad de la base de datos...');

  if (db.isPostgres) {
    // Schema para PostgreSQL (Supabase)
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS sectores (
          id SERIAL PRIMARY KEY,
          nombre TEXT UNIQUE NOT NULL,
          icono TEXT DEFAULT '🏠'
        );

        CREATE TABLE IF NOT EXISTS mesas (
          id SERIAL PRIMARY KEY,
          numero INTEGER UNIQUE NOT NULL,
          estado TEXT DEFAULT 'disponible',
          sector TEXT DEFAULT 'Adentro',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categorias (
          id SERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          icono TEXT,
          orden INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS productos (
          id SERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          precio DECIMAL(10,2) NOT NULL,
          imagen_url TEXT,
          categoria_id INTEGER REFERENCES categorias(id),
          disponible INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pedidos (
          id SERIAL PRIMARY KEY,
          mesa_id INTEGER REFERENCES mesas(id),
          estado TEXT DEFAULT 'recibido',
          notas TEXT,
          total DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS detalle_pedidos (
          id SERIAL PRIMARY KEY,
          pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
          producto_id INTEGER REFERENCES productos(id),
          cantidad INTEGER NOT NULL DEFAULT 1,
          precio_unitario DECIMAL(10,2) NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          notas TEXT
        );

        CREATE TABLE IF NOT EXISTS historial_pedidos (
          id SERIAL PRIMARY KEY,
          mesa_numero INTEGER NOT NULL,
          pedido_original_id INTEGER,
          detalle TEXT NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          cerrado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metodo_pago TEXT,
          procesado INTEGER DEFAULT 0
        );

        -- Índices de Optimización para PostgreSQL
        CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
        CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa_id);
        CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
        CREATE INDEX IF NOT EXISTS idx_detalle_pedido_id ON detalle_pedidos(pedido_id);
        CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_pedidos(cerrado_at);
        CREATE INDEX IF NOT EXISTS idx_historial_procesado ON historial_pedidos(procesado);

        -- Tabla de Estadísticas Pre-calculadas (Optimización Extrema)
        CREATE TABLE IF NOT EXISTS recaudacion_diaria (
          fecha DATE PRIMARY KEY,
          total_ventas DECIMAL(12,2) DEFAULT 0,
          cantidad_pedidos INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed inicial de sectores si está vacío
      const res = await db.query('SELECT COUNT(*) FROM sectores');
      if (parseInt(res.rows[0].count) === 0) {
        await db.query("INSERT INTO sectores (nombre, icono) VALUES ('Adentro', '🏠'), ('Patio', '🌿'), ('Deck (Calle)', '🏙️')");
        console.log('Sectores iniciales creados en Postgres.');
      }

      // Auto-seed de productos si está vacío
      const resCat = await db.query('SELECT COUNT(*) FROM categorias');
      if (parseInt(resCat.rows[0].count) === 0) {
        console.log('🚀 Base de datos vacía detectada. Ejecutando Seed...');
        // Aquí llamaríamos al seed adaptado para Postgres si fuera necesario
        // Por ahora dejamos que el admin lo cargue o adaptamos seed.js
      }

    } catch (err) {
      console.error('❌ Error inicializando Postgres:', err.message);
    }
  } else {
    // Lógica original de SQLite
    db.exec(`
      CREATE TABLE IF NOT EXISTS sectores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        icono TEXT DEFAULT '🏠'
      );
      CREATE TABLE IF NOT EXISTS mesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero INTEGER UNIQUE NOT NULL,
        estado TEXT DEFAULT 'disponible' CHECK(estado IN ('disponible', 'ocupada', 'por_cobrar')),
        sector TEXT DEFAULT 'Adentro',
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

      -- Índices de Optimización para SQLite
      CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
      CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa_id);
      CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
      CREATE INDEX IF NOT EXISTS idx_detalle_pedido_id ON detalle_pedidos(pedido_id);
      CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_pedidos(cerrado_at);
    `);

    // Migración: Agregar columna 'procesado' si no existe (SQLite)
    try {
      db.exec('ALTER TABLE historial_pedidos ADD COLUMN procesado INTEGER DEFAULT 0');
    } catch (e) {
      // Ignorar si la columna ya existe
    }

    db.exec('CREATE INDEX IF NOT EXISTS idx_historial_procesado ON historial_pedidos(procesado);');

    db.exec(`
      -- Tabla de Estadísticas Pre-calculadas (Optimización Extrema)
      CREATE TABLE IF NOT EXISTS recaudacion_diaria (
        fecha TEXT PRIMARY KEY,
        total_ventas REAL DEFAULT 0,
        cantidad_pedidos INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
      );
    `);
  }
  console.log('✅ Estructura de base de datos lista.');
}

module.exports = init;