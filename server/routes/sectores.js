const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const sectores = db.prepare('SELECT * FROM sectores').all();
    res.json(sectores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { nombre, icono } = req.body;
  try {
    const info = db.prepare('INSERT INTO sectores (nombre, icono) VALUES (?, ?)').run(nombre, icono || '🏠');
    res.status(201).json({ id: info.lastInsertRowid, nombre, icono: icono || '🏠' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, icono } = req.body;
  try {
    const oldSector = db.prepare('SELECT nombre FROM sectores WHERE id = ?').get(id);
    db.prepare('UPDATE sectores SET nombre = ?, icono = ? WHERE id = ?').run(nombre, icono, id);
    if (oldSector) {
      db.prepare('UPDATE mesas SET sector = ? WHERE sector = ?').run(nombre, oldSector.nombre);
    }
    res.json({ id, nombre, icono });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM sectores WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
