/**
 * Servidor Principal - Express + Socket.IO
 * Puerto: 3001 (configurable via .env)
 */
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');              // Headers de seguridad HTTP
const { rateLimit } = require('express-rate-limit'); // Protección contra fuerza bruta
const cookieParser = require('cookie-parser'); // Para leer cookies HttpOnly del admin
const path = require('path');
const multer = require('multer');
const compression = require('compression'); // Compresión Gzip/Brotli

// Inicializar base de datos (crea tablas)
const initDB = require('./init');

const app = express();
const server = http.createServer(app);

// Configuraciones de rendimiento y seguridad
app.disable('x-powered-by'); // Ahorra bytes y oculta tecnología
app.set('trust proxy', 1);    // Confía en proxies (Render, Vercel, Cloudflare)
app.use(compression());      // Comprime TODAS las respuestas

// NOTA: memoryStorage guarda archivos en RAM antes de enviarlos a Cloudinary.
// Límite reducido a 3MB para mitigar el riesgo de consumo excesivo de memoria
// en caso de subidas simultáneas. Para mayor escala, considerar disk storage + queue.
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB máximo
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
    origin: allowedOrigins, // Mismo whitelist que Express — no permitir origenes externos
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({                               // Headers de seguridad HTTP automaticos
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Necesario para imagenes Cloudinary
}));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' })); // Limitar tamaño del body JSON
app.use(cookieParser());                  // Habilitar lectura de cookies HttpOnly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('io', io);

// Rate limiting global: 100 requests cada 15 minutos por IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intentá de nuevo en 15 minutos.' },
});
app.use('/api', globalLimiter);

// Rate limiting estricto en login: 10 intentos cada 15 minutos por IP
// Previene ataques de fuerza bruta sobre las credenciales del admin
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Esperá 15 minutos.' },
});
app.use('/api/auth/login', loginLimiter);

// ==========================================
// RUTA DE CARGA DE IMAGENES (CLOUDINARY)
// Protegida con authMiddleware para evitar consumo no autorizado de cuota.
// ==========================================
app.post('/api/upload', (req, res, next) => {
  // authMiddleware se importa despues de definir las rutas, usamos require dinamico
  const { authMiddleware: auth } = require('./routes/auth');
  auth(req, res, next);
}, upload.single('image'), async (req, res) => {
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
const { router: authRouter, authMiddleware } = require('./routes/auth');
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

// Health check — Protegido: no exponer conteos de DB publicamente
app.get('/api/health', authMiddleware, async (req, res) => {
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

// Seed de emergencia — PROTEGIDO: solo el admin puede ejecutarlo
app.post('/api/seed-now', authMiddleware, async (req, res) => {
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

  // Solo retransmitir campos controlados — nunca ejecutar payloads del cliente
  socket.on('actualizar_pedido', (data) => {
    if (data?.id && data?.estado) io.emit('pedido_actualizado', { id: data.id, estado: data.estado });
  });
  socket.on('cerrar_mesa', (data) => {
    if (data?.id) io.emit('mesa_cerrada', { id: data.id });
  });
  socket.on('mesa_update', (data) => {
    if (data?.id && data?.estado) io.emit('mesa_actualizada', { id: data.id, estado: data.estado });
  });

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

// ==========================================
// ERROR HANDLER GLOBAL (E)
// Captura cualquier error propagado con next(err) desde las rutas.
// Devuelve JSON limpio — nunca expone stack traces al cliente.
// ==========================================
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : (err.message || 'Error interno del servidor');
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);
  res.status(status).json({ error: message });
});

// ==========================================
// MANEJO DE ERRORES DE PROCESO (F)
// Evita que el servidor muera silenciosamente sin contexto.
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('💥 [uncaughtException] Error no capturado:', err);
  process.exit(1); // Salida controlada para que el process manager pueda reiniciar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [unhandledRejection] Promise rechazada sin .catch():', reason);
  // No salimos — el servidor puede seguir funcionando en otros requests
});

module.exports = { app, server, io };
