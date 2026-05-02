/**
 * Servidor Principal - Express + Socket.IO
 * Puerto: 3001 (configurable via .env)
 * 
 * Integra todas las rutas REST y la comunicación WebSocket en tiempo real.
 */
require('dotenv').config();

// Inicializar base de datos (crea tablas y seed si está vacía)
require('./init');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

// Configuración de almacenamiento para fotos de productos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, webp)"));
  }
});

// Socket.IO con CORS adaptable
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Hacer io accesible en las rutas
app.set('io', io);

// ==========================================
// RUTA DE CARGA DE IMÁGENES
// ==========================================
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }
  const protocol = req.protocol;
  const host = req.get('host');
  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// ==========================================
// RUTAS REST
// ==========================================
const { router: authRouter } = require('./routes/auth');
const mesasRouter = require('./routes/mesas');
const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');
const historialRouter = require('./routes/historial');

app.use('/api/auth', authRouter);
app.use('/api/mesas', mesasRouter);
app.use('/api/historial', historialRouter);
app.use('/api', productosRouter);
app.use('/api/pedidos', pedidosRouter);

// Health check con estado de la DB
app.get('/api/health', (req, res) => {
  const db = require('./db');
  const mesas = db.prepare('SELECT COUNT(*) as c FROM mesas').get().c;
  const cats = db.prepare('SELECT COUNT(*) as c FROM categorias').get().c;
  const prods = db.prepare('SELECT COUNT(*) as c FROM productos').get().c;
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: { mesas, categorias: cats, productos: prods } });
});

// Seed de emergencia: ejecuta seed-produccion si la DB está vacía
app.post('/api/seed-now', (req, res) => {
  try {
    const db = require('./db');
    const cats = db.prepare('SELECT COUNT(*) as c FROM categorias').get().c;
    if (cats > 0) {
      return res.json({ ok: false, message: `DB ya tiene datos (${cats} categorias). No se hizo nada.` });
    }
    require('./seed-produccion');
    const newCats = db.prepare('SELECT COUNT(*) as c FROM categorias').get().c;
    const newProds = db.prepare('SELECT COUNT(*) as c FROM productos').get().c;
    const newMesas = db.prepare('SELECT COUNT(*) as c FROM mesas').get().c;
    res.json({ ok: true, message: 'Seed ejecutado', mesas: newMesas, categorias: newCats, productos: newProds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// WEBSOCKET - EVENTOS EN TIEMPO REAL
// ==========================================
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  socket.on('nuevo_pedido', (pedido) => {
    console.log(`📦 Nuevo pedido recibido - Mesa ${pedido.mesa_numero}`);
    io.emit('pedido_recibido', pedido);
  });

  socket.on('actualizar_pedido', (data) => {
    console.log(`🔄 Pedido ${data.id} → ${data.estado}`);
    io.emit('pedido_actualizado', data);
  });

  socket.on('cerrar_mesa', (data) => {
    console.log(`🔒 Mesa ${data.mesa_numero} cerrada`);
    io.emit('mesa_cerrada', data);
  });

  socket.on('mesa_update', (data) => {
    io.emit('mesa_actualizada', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('');
  console.log('==========================================');
  console.log('  🍽️  Servidor Restaurante QR');
  console.log('==========================================');
  console.log(`  🌐 API REST:    http://localhost:${PORT}/api`);
  console.log(`  🔌 WebSocket:   http://localhost:${PORT}`);
  console.log(`  📚 Health:      http://localhost:${PORT}/api/health`);
  console.log('==========================================');
  console.log('');
});

module.exports = { app, server, io };
