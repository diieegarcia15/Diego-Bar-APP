/**
 * Rutas de Productos y Categorías
 * GET /api/categorias       → Listar categorías
 * GET /api/productos        → Listar productos (con filtro por categoría)
 * GET /api/productos/:id    → Detalle de un producto
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/categorias
 * Listar todas las categorías ordenadas
 */
router.get('/categorias', (req, res) => {
  try {
    const categorias = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id AND p.disponible = 1) as total_productos
      FROM categorias c
      ORDER BY c.orden
    `).all();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/categorias
 * Crear una nueva categoría
 */
router.post('/categorias', (req, res) => {
  try {
    const { nombre, icono, orden = 0 } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const result = db.prepare('INSERT INTO categorias (nombre, icono, orden) VALUES (?, ?, ?)')
      .run(nombre, icono || '🍴', orden);

    const nueva = db.prepare('SELECT * FROM categorias WHERE id = ?').get(result.lastInsertRowid);
    
    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/categorias/:id
 * Actualizar una categoría existente
 */
router.put('/categorias/:id', (req, res) => {
  try {
    const { nombre, icono, orden } = req.body;
    const { id } = req.params;
    
    const result = db.prepare(`
      UPDATE categorias 
      SET nombre = COALESCE(?, nombre),
          icono = COALESCE(?, icono),
          orden = COALESCE(?, orden)
      WHERE id = ?
    `).run(
      nombre !== undefined ? nombre : null,
      icono !== undefined ? icono : null,
      orden !== undefined ? orden : null,
      id
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' });

    const updated = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id);
    
    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/categorias/:id
 * Eliminar una categoría y sus productos asociados
 */
router.delete('/categorias/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar primero los productos de esa categoría
    db.prepare('DELETE FROM productos WHERE categoria_id = ?').run(id);
    
    // Eliminar la categoría
    const result = db.prepare('DELETE FROM categorias WHERE id = ?').run(id);
    
    if (result.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' });

    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/productos
 * Listar productos disponibles. Filtro opcional por categoría.
 * Query params: ?categoria_id=1
 */
router.get('/productos', (req, res) => {
  try {
    const { categoria_id } = req.query;
    let query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.disponible = 1
    `;
    const params = [];

    if (categoria_id) {
      query += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    query += ' ORDER BY c.orden, p.nombre';

    const productos = db.prepare(query).all(...params);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/productos/:id
 * Detalle de un producto específico
 */
router.get('/productos/:id', (req, res) => {
  try {
    const producto = db.prepare(`
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/productos
 * Crear un nuevo producto
 */
router.post('/productos', (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen_url, categoria_id, disponible = 1 } = req.body;
    
    if (!nombre || !precio || !categoria_id) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const result = db.prepare(`
      INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria_id, disponible)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nombre, descripcion, precio, imagen_url, categoria_id, disponible);

    const nuevoProducto = db.prepare('SELECT * FROM productos WHERE id = ?').get(result.lastInsertRowid);
    
    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.status(201).json(nuevoProducto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/productos/:id
 * Actualizar un producto existente
 */
router.put('/productos/:id', (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen_url, categoria_id, disponible } = req.body;
    const { id } = req.params;
    
    // Obtenemos producto actual para hacer un update parcial
    const current = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const result = db.prepare(`
      UPDATE productos 
      SET nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          precio = COALESCE(?, precio),
          imagen_url = COALESCE(?, imagen_url),
          categoria_id = COALESCE(?, categoria_id),
          disponible = COALESCE(?, disponible)
      WHERE id = ?
    `).run(
      nombre !== undefined ? nombre : null,
      descripcion !== undefined ? descripcion : null,
      precio !== undefined ? precio : null,
      imagen_url !== undefined ? imagen_url : null,
      categoria_id !== undefined ? categoria_id : null,
      disponible !== undefined ? disponible : null,
      id
    );

    const updated = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);

    const io = req.app.get('io');
    if (io) io.emit('menu_actualizado');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/productos/:id
 * Eliminar un producto
 */
router.delete('/productos/:id', (req, res) => {
  try {
    // Soft delete (marcar como no disponible) si el producto ya tiene pedidos asociados, 
    // pero si no tiene historial podríamos borrarlo. Vamos a hacer hard delete si queremos,
    // o mejor un soft delete para no romper historiales. En este caso haremos soft delete por seguridad, 
    // o hard delete si lo piden. El usuario pidió "eliminar productos". Vamos a hacer hard delete, y que CASCADE borre el detalle_pedidos.
    // Wait, si hacemos hard delete, los pedidos en el historial que tengan JSON string no se rompen, 
    // pero los detalle_pedidos actuales sí (ON DELETE CASCADE está configurado).
    const result = db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
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
