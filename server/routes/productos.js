/**
 * Rutas de Productos y Categorías (Compatible SQLite/PostgreSQL)
 * GET /categorias y GET /productos — públicos (los usan los clientes de mesa)
 * POST / PUT / DELETE — protegidos con authMiddleware
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');

/**
 * GET /api/categorias
 */
router.get('/categorias', async (req, res) => {
  try {
    const query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id AND p.disponible = 1) as total_productos
      FROM categorias c
      ORDER BY c.orden
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/categorias — Protegido
 */
router.post('/categorias', authMiddleware, async (req, res) => {
  try {
    const { nombre, icono, orden = 0 } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    let nuevaId;
    if (db.isPostgres) {
      // RETURNING id evita el doble INSERT que existía antes
      const result = await db.query(
        'INSERT INTO categorias (nombre, icono, orden) VALUES (?, ?, ?) RETURNING id',
        [nombre, icono || '🍴', orden]
      );
      nuevaId = result.rows[0].id;
    } else {
      const result = await db.query(
        'INSERT INTO categorias (nombre, icono, orden) VALUES (?, ?, ?)',
        [nombre, icono || '🍴', orden]
      );
      nuevaId = result.lastID;
    }

    const nueva = (await db.query('SELECT * FROM categorias WHERE id = ?', [nuevaId])).rows[0];

    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/categorias/:id — Protegido
 */
router.put('/categorias/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, icono, orden } = req.body;
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE categorias 
      SET nombre = COALESCE(?, nombre),
          icono = COALESCE(?, icono),
          orden = COALESCE(?, orden)
      WHERE id = ?
    `, [
      nombre !== undefined ? nombre : null,
      icono !== undefined ? icono : null,
      orden !== undefined ? orden : null,
      id
    ]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });

    const updated = (await db.query('SELECT * FROM categorias WHERE id = ?', [id])).rows[0];
    
    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/categorias/:id — Protegido
 */
router.delete('/categorias/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM productos WHERE categoria_id = ?', [id]);
    const result = await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoría no encontrada' });

    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/productos
 */
router.get('/productos', async (req, res) => {
  try {
    const { categoria_id } = req.query;
    let queryText = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.disponible = 1
    `;
    const params = [];

    if (categoria_id) {
      queryText += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    queryText += ' ORDER BY c.orden, p.nombre';

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/productos/:id
 */
router.get('/productos/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = ?
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/productos — Protegido
 */
router.post('/productos', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen_url, categoria_id, disponible = 1 } = req.body;
    
    if (!nombre || !precio || !categoria_id) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    let result;
    if (db.isPostgres) {
      result = await db.query(`
        INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria_id, disponible)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING id
      `, [nombre, descripcion, precio, imagen_url, categoria_id, disponible]);
    } else {
      result = await db.query(`
        INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria_id, disponible)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [nombre, descripcion, precio, imagen_url, categoria_id, disponible]);
    }

    const lastId = db.isPostgres ? result.rows[0].id : result.lastID;
    const nuevoProducto = (await db.query('SELECT * FROM productos WHERE id = ?', [lastId])).rows[0];
    
    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.status(201).json(nuevoProducto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/productos/:id — Protegido
 */
router.put('/productos/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen_url, categoria_id, disponible } = req.body;
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE productos 
      SET nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          precio = COALESCE(?, precio),
          imagen_url = COALESCE(?, imagen_url),
          categoria_id = COALESCE(?, categoria_id),
          disponible = COALESCE(?, disponible)
      WHERE id = ?
    `, [
      nombre !== undefined ? nombre : null,
      descripcion !== undefined ? descripcion : null,
      precio !== undefined ? precio : null,
      imagen_url !== undefined ? imagen_url : null,
      categoria_id !== undefined ? categoria_id : null,
      disponible !== undefined ? disponible : null,
      id
    ]);

    const updated = (await db.query('SELECT * FROM productos WHERE id = ?', [id])).rows[0];

    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/productos/:id — Protegido
 */
router.delete('/productos/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;