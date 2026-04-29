/**
 * Rutas de Historial
 * GET /api/historial → Listar historial de pedidos cerrados
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/historial
 * Listar historial de pedidos cerrados, ordenados por fecha
 */
router.get('/', (req, res) => {
  try {
    const historial = db.prepare(`
      SELECT * FROM historial_pedidos
      ORDER BY cerrado_at DESC
      LIMIT 500
    `).all();

    // Parsear el campo detalle de JSON string a objeto
    const result = historial.map(h => ({
      ...h,
      detalle: typeof h.detalle === 'string' ? JSON.parse(h.detalle) : h.detalle
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/historial/reiniciar
 * Marcar todos los registros como procesados (Reiniciar recaudación visual)
 */
router.post('/reiniciar', (req, res) => {
  try {
    db.prepare('UPDATE historial_pedidos SET procesado = 1 WHERE procesado = 0').run();
    res.json({ success: true, message: 'Recaudación reiniciada correctamente' });
  } catch (err) {
    console.error('Error al reiniciar historial:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/historial
 * Vaciado total (Hard reset - Borra todo, incluyendo calendario)
 */
router.delete('/', (req, res) => {
  try {
    db.prepare('DELETE FROM historial_pedidos').run();
    res.json({ success: true, message: 'Historial eliminado permanentemente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
