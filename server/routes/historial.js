/**
 * Rutas de Historial (Compatible SQLite/PostgreSQL)
 * POST /reiniciar y DELETE / protegidos con authMiddleware.
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');

/**
 * GET /api/historial — Protegido
 * Datos financieros sensibles: solo accesible para el admin autenticado.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM historial_pedidos ORDER BY cerrado_at DESC LIMIT 500');
    
    const processed = result.rows.map(h => ({
      ...h,
      detalle: typeof h.detalle === 'string' ? JSON.parse(h.detalle) : h.detalle
    }));

    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/historial/reiniciar
 * Protegido: solo el admin puede reiniciar la recaudación.
 */
router.post('/reiniciar', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE historial_pedidos SET procesado = 1 WHERE procesado = 0');
    res.json({ success: true, message: 'Recaudación reiniciada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/historial
 * Protegido: eliminar el historial es una operación irreversible.
 */
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM historial_pedidos');
    res.json({ success: true, message: 'Historial eliminado permanentemente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;