/**
 * Servidor Principal - Express + Socket.IO
 * Puerto: 3001 (configurable via .env)
 */
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Inicializar base de datos (crea tablas)
const initDB = require('./init');

const app = express();
const server = http.createServer(app);

// Configuración de almacenamiento en memoria para Cloudinary
const storage = multer.memoryStorage();
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
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('io', io);

// ==========================================
// RUTA DE CARGA DE IMÁGENES (CLOUDINARY)
// ==========================================
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });
  
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream({ folder: 'diegobar' }, (error, result) => {
          if (result) resolve(result); else reject(error);
        });
        require('stream').Readable.from(buffer).pipe(stream);
      });
    };

    const result = await uploadFromBuffer(req.file.buffer);
    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Error al subir a la nube' });
  }
});

// ==========================================
// RUTAS REST
// ==========================================
const { router: authRouter } = require('./routes/auth');
const mesasRouter = require('./routes/mesas');
const productosRouter = require('./routes/productos');
const pedidosRouter = require('./routes/pedidos');
const historialRouter = require('./routes/historial');
const sectoresRouter = require('./routes/sectores');

app.use('/api/auth', authRouter);
app.use('/api/mesas', mesasRouter);
app.use('/api/historial', historialRouter);
app.use('/api', sectoresRouter);
app.use('/api', productosRouter);
app.use('/api/pedidos', pedidosRouter);

// Health check
app.get('/api/health', async (req, res) => {
  const db = require('./db');
  try {
    let mesas, cats, prods;
    if (db.isPostgres) {
      mesas = (await db.query('SELECT COUNT(*) FROM mesas')).rows[0].count;
      cats = (await db.query('SELECT COUNT(*) FROM categorias')).rows[0].count;
      prods = (await db.query('SELECT COUNT(*) FROM productos')).rows[0].count;
    } else {
      mesas = db.prepare('SELECT COUNT(*) as c FROM mesas').get().c;
      cats = db.prepare('SELECT COUNT(*) as c FROM categorias').get().c;
      prods = db.prepare('SELECT COUNT(*) as c FROM productos').get().c;
    }
    res.json({ status: 'ok', db: { mesas, categorias: cats, productos: prods } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed de emergencia
app.post('/api/seed-now', async (req, res) => {
  try {
    const db = require('./db');
    let catsCount;
    if (db.isPostgres) {
      catsCount = (await db.query('SELECT COUNT(*) FROM categorias')).rows[0].count;
    } else {
      catsCount = db.prepare('SELECT COUNT(*) as c FROM categorias').get().c;
    }

    if (parseInt(catsCount) > 0) return res.json({ ok: false, message: 'DB ya tiene datos' });
    
    if (!db.isPostgres) {
      require('./seed-produccion');
      res.json({ ok: true, message: 'Seed ejecutado (SQLite)' });
    } else {
      res.json({ ok: false, message: 'Seed no disponible para Postgres automáticamente' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// WEBSOCKET
// ==========================================
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on('nuevo_pedido', (pedido) => io.emit('pedido_recibido', pedido));
  socket.on('actualizar_pedido', (data) => io.emit('pedido_actualizado', data));
  socket.on('cerrar_mesa', (data) => io.emit('mesa_cerrada', data));
  socket.on('mesa_update', (data) => io.emit('mesa_actualizada', data));
  socket.on('disconnect', () => console.log(`❌ Cliente desconectado: ${socket.id}`));
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3001;
initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('💥 Error fatal al iniciar DB:', err);
});

module.exports = { app, server, io };
