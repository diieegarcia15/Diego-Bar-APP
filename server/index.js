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

const app = express();
const server = http.createServer(app);

// Socket.IO con CORS adaptable
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL, // Para producción (Vercel)
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

// Hacer io accesible en las rutas
app.set('io', io);

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// WEBSOCKET - EVENTOS EN TIEMPO REAL
// ==========================================
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Cliente envía un nuevo pedido
  socket.on('nuevo_pedido', (pedido) => {
    console.log(`📦 Nuevo pedido recibido - Mesa ${pedido.mesa_numero}`);
    // Broadcast a todos los clientes (especialmente al admin)
    io.emit('pedido_recibido', pedido);
  });

  // Admin actualiza el estado de un pedido
  socket.on('actualizar_pedido', (data) => {
    console.log(`🔄 Pedido ${data.id} → ${data.estado}`);
    io.emit('pedido_actualizado', data);
  });

  // Admin cierra una mesa
  socket.on('cerrar_mesa', (data) => {
    console.log(`🔒 Mesa ${data.mesa_numero} cerrada`);
    io.emit('mesa_cerrada', data);
  });

  // Actualización de estado de mesa
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
  console.log(`  💚 Health:      http://localhost:${PORT}/api/health`);
  console.log('==========================================');
  console.log('');
});

module.exports = { app, server, io };
