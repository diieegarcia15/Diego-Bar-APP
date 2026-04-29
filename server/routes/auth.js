/**
 * Rutas de Autenticación - Admin
 * POST /api/auth/login  → Login con usuario/contraseña
 * GET  /api/auth/verify → Verificar token JWT válido
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_cambiar';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Middleware de autenticación para rutas protegidas
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * POST /api/auth/login
 * Body: { usuario, password }
 * Returns: { token, usuario }
 */
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  if (usuario !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { usuario, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    usuario,
    message: 'Login exitoso'
  });
});

/**
 * GET /api/auth/verify
 * Headers: Authorization: Bearer <token>
 * Returns: { valid: true, usuario }
 */
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, usuario: req.admin.usuario });
});

module.exports = { router, authMiddleware };
