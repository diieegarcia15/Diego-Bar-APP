/**
 * Script de Inicialización Inteligente para Producción
 * Crea las tablas SOLO si no existen, preservando datos existentes.
 * Se ejecuta automáticamente al iniciar el servidor en Render.
 */
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = require('./db');

// Crear tablas si no existen (sin borrar datos)
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
    metodo_pago TEXT
  );
`);

// Insertar datos iniciales SOLO si las tablas están vacías
const mesaCount = db.prepare('SELECT COUNT(*) as count FROM mesas').get();

if (mesaCount.count === 0) {
  console.log('📦 Base de datos vacía - cargando datos iniciales...');

  const insertMesa = db.prepare('INSERT INTO mesas (numero, sector) VALUES (?, ?)');
  const insertMesas = db.transaction((mesas) => {
    for (const [numero, sector] of mesas) {
      insertMesa.run(numero, sector);
    }
  });
  insertMesas([
    [1, 'Adentro'], [2, 'Adentro'], [3, 'Adentro'], [4, 'Adentro'],
    [5, 'Patio'], [6, 'Patio'], [7, 'Patio'],
    [8, 'Deck (Calle)'], [9, 'Deck (Calle)'], [10, 'Deck (Calle)']
  ]);

  const insertCategoria = db.prepare('INSERT INTO categorias (nombre, icono, orden) VALUES (?, ?, ?)');
  const categorias = [
    ['Aperitivos', 'Utensils', 1],
    ['Sopas', 'Soup', 2],
    ['Ensaladas', 'Leaf', 3],
    ['Platos Principales', 'ChefHat', 4],
    ['Pastas', 'CookingPot', 5],
    ['Bebidas', 'GlassWater', 6],
    ['Postres', 'IceCream', 7],
    ['Cervezas', 'Beer', 8],
    ['Tragos', 'Martini', 9],
    ['Vinos y Espumantes', 'Wine', 10],
  ];
  const insertCategorias = db.transaction(() => {
    for (const [nombre, icono, orden] of categorias) {
      insertCategoria.run(nombre, icono, orden);
    }
  });
  insertCategorias();

  const insertProducto = db.prepare(`
    INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  const productos = [
    ['Empanadas x6', 'Surtido de empanadas: carne, pollo y jamón y queso', 7800, 'https://images.unsplash.com/photo-1628198751509-02eb4d567364?w=400&h=300&fit=crop', 1],
    ['Provoleta', 'Provolone fundido a la parrilla con orégano y aceite de oliva', 6500, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop', 1],
    ['Tabla de Fiambres', 'Selección de jamón crudo, salame, quesos y aceitunas', 9800, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&h=300&fit=crop', 1],
    ['Bruschetta Criolla', 'Pan tostado con tomate, cebolla morada y chimichurri', 4500, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop', 1],
    ['Rabas', 'Calamares rebozados con limón y salsa alioli', 7200, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop', 1],
    ['Locro Criollo', 'Guiso tradicional con maíz, porotos, chorizo y mondongo', 8500, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', 2],
    ['Sopa Crema de Calabaza', 'Crema suave de calabaza con croutones y aceite de oliva', 5800, 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit=crop', 2],
    ['Caldo de Verduras', 'Caldo casero con vegetales de estación', 4200, 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&h=300&fit=crop', 2],
    ['Ensalada César', 'Lechuga romana, pollo grillado, parmesano y croutones', 7500, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', 3],
    ['Ensalada Griega', 'Tomate, pepino, aceitunas, queso feta y orégano', 6800, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', 3],
    ['Ensalada Waldorf', 'Manzana verde, apio, nueces y mayonesa', 6200, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', 3],
    ['Milanesa Napolitana', 'Milanesa de ternera con salsa de tomate, jamón y queso gratinado', 12500, 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop', 4],
    ['Bife de Chorizo', 'Corte premium de 400g a la parrilla con guarnición', 18500, 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop', 4],
    ['Pollo al Verdeo', 'Suprema de pollo grillada con salsa de verdeo y papas noisette', 11800, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', 4],
    ['Matambre a la Pizza', 'Matambre de cerdo con salsa de tomate, queso y orégano', 13500, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', 4],
    ['Salmón a la Parrilla', 'Filet de salmón rosado con vegetales grillados', 16800, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', 4],
    ['Lomo a la Pimienta', 'Medallón de lomo con salsa de pimienta negra y puré', 17500, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop', 4],
    ['Ñoquis con Bolognesa', 'Ñoquis de papa caseros con salsa bolognesa', 8900, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop', 5],
    ['Ravioles de Ricota', 'Ravioles caseros rellenos de ricota y nuez con salsa filetto', 9500, 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400&h=300&fit=crop', 5],
    ['Fetuccini Alfredo', 'Pasta fresca con salsa crema y parmesano', 8500, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&h=300&fit=crop', 5],
    ['Coca-Cola', 'Gaseosa línea Coca-Cola 500ml', 2500, 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop', 6],
    ['Agua Mineral', 'Agua mineral con o sin gas 500ml', 1800, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', 6],
    ['Limonada Casera', 'Limonada fresca con menta y jengibre', 3200, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop', 6],
    ['Vino Malbec Copa', 'Copa de Malbec mendocino reserva', 4500, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop', 6],
    ['Flan con Dulce de Leche', 'Flan casero con dulce de leche y crema', 5200, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop', 7],
    ['Tiramisú', 'Postre italiano con café, mascarpone y cacao', 6800, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop', 7],
    ['Panqueques con Dulce de Leche', 'Panqueques rellenos de dulce de leche y nuez', 4800, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', 7],
  ];

  const insertProductos = db.transaction(() => {
    for (const p of productos) {
      insertProducto.run(...p);
    }
  });
  insertProductos();

  console.log('✅ Datos iniciales cargados correctamente');
} else {
  console.log(`✅ Base de datos existente con ${mesaCount.count} mesas - omitiendo seed`);
}
