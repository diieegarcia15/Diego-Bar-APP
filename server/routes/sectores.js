/**
 * Rutas de Sectores (Compatible SQLite/PostgreSQL)
 * GET /sectores — público (lo usa el cliente de mesa)
 * POST / PUT / DELETE — protegidos con authMiddleware
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');

/**
 * GET /api/sectores
 */
router.get('/sectores', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sectores');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sectores — Protegido
 */
router.post('/sectores', authMiddleware, async (req, res) => {
  const { nombre, icono } = req.body;
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del sector es obligatorio' });
  }
  try {
    let result;
    if (db.isPostgres) {
      result = await db.query('INSERT INTO sectores (nombre, icono) VALUES (?, ?) RETURNING id', [nombre.trim(), icono || '🏠']);
    } else {
      result = await db.query('INSERT INTO sectores (nombre, icono) VALUES (?, ?)', [nombre.trim(), icono || '🏠']);
    }
    const lastId = db.isPostgres ? result.rows[0].id : result.lastID;
    res.status(201).json({ id: lastId, nombre: nombre.trim(), icono: icono || '🏠' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/sectores/:id — Protegido
 */
router.put('/sectores/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nombre, icono } = req.body;
  try {
    const oldSectorRes = await db.query('SELECT nombre FROM sectores WHERE id = ?', [id]);
    const oldSector = oldSectorRes.rows[0];
    
    await db.query('UPDATE sectores SET nombre = ?, icono = ? WHERE id = ?', [nombre, icono, id]);
    
    if (oldSector) {
      await db.query('UPDATE mesas SET sector = ? WHERE sector = ?', [nombre, oldSector.nombre]);
    }
    res.json({ id, nombre, icono });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/sectores/:id — Protegido
 */
router.delete('/sectores/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM sectores WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;