/**
 * Rutas de Sectores (Compatible SQLite/PostgreSQL)
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

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
 * POST /api/sectores
 */
router.post('/sectores', async (req, res) => {
  const { nombre, icono } = req.body;
  try {
    let result;
    if (db.isPostgres) {
      result = await db.query('INSERT INTO sectores (nombre, icono) VALUES (?, ?) RETURNING id', [nombre, icono || '🏠']);
    } else {
      result = await db.query('INSERT INTO sectores (nombre, icono) VALUES (?, ?)', [nombre, icono || '🏠']);
    }
    const lastId = db.isPostgres ? result.rows[0].id : result.lastID;
    res.status(201).json({ id: lastId, nombre, icono: icono || '🏠' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/sectores/:id
 */
router.put('/sectores/:id', async (req, res) => {
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
 * DELETE /api/sectores/:id
 */
router.delete('/sectores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM sectores WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;