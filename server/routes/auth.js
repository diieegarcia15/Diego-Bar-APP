/**
 * Rutas de Autenticación - Admin
 * POST /api/auth/login  → Login con usuario/contraseña (responde con cookie HttpOnly)
 * GET  /api/auth/verify → Verificar que la cookie JWT sea válida
 * POST /api/auth/logout → Limpiar la cookie de sesión
 *
 * Por qué cookie HttpOnly en lugar de localStorage:
 *   - Un script malicioso (XSS) no puede leer la cookie desde JS
 *   - El navegador la envía automáticamente en cada request al backend
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Para comparación de credenciales en tiempo constante
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_cambiar';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Opciones de cookie compartidas
const COOKIE_OPTIONS = {
  httpOnly: true,             // Inaccesible desde JavaScript (protege contra XSS)
  sameSite: 'strict',         // No se envía en requests cross-site (protege contra CSRF)
  secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
  maxAge: 12 * 60 * 60 * 1000, // 12 horas en milisegundos
  path: '/',
};

/**
 * Middleware de autenticación para rutas protegidas.
 * Lee el JWT de la cookie HttpOnly (o del header Authorization como fallback).
 */
function authMiddleware(req, res, next) {
  // Intentar leer desde cookie HttpOnly primero
  let token = req.cookies?.admin_token;

  // Fallback: Authorization header (para compatibilidad y herramientas de testing)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    // Limpiar cookie inválida para forzar nuevo login
    res.clearCookie('admin_token', { path: '/' });
    return res.status(401).json({ error: 'Sesión expirada o inválida' });
  }
}

/**
 * POST /api/auth/login
 * Body: { usuario, password }
 * Returns: { usuario, message } + cookie HttpOnly 'admin_token'
 */
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  // Comparación en tiempo constante — evita timing attacks.
  // BUGFIX: timingSafeEqual() lanza TypeError si los buffers difieren en tamaño.
  // Solución: hashear con HMAC-SHA256 → siempre produce 32 bytes en ambos lados.
  const hmac = (val) => crypto.createHmac('sha256', JWT_SECRET).update(val || '').digest();
  const userMatch = crypto.timingSafeEqual(hmac(usuario), hmac(ADMIN_USER));
  const passMatch = crypto.timingSafeEqual(hmac(password), hmac(ADMIN_PASSWORD));

  if (!userMatch || !passMatch) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { usuario, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  // Enviar token como cookie HttpOnly (inaccesible desde JS)
  res.cookie('admin_token', token, COOKIE_OPTIONS);

  res.json({
    usuario,
    message: 'Login exitoso'
  });
});

/**
 * GET /api/auth/verify
 * Lee la cookie HttpOnly y verifica que el JWT sea válido.
 * Returns: { valid: true, usuario }
 */
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, usuario: req.admin.usuario });
});

/**
 * POST /api/auth/logout
 * Limpia la cookie de sesión del navegador.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  res.json({ message: 'Sesión cerrada' });
});

module.exports = { router, authMiddleware };
