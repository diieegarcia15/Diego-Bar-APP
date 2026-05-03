/**
 * Rutas de Pedidos (Compatible SQLite/PostgreSQL)
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/pedidos
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*, m.numero as mesa_numero
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      ORDER BY p.created_at DESC
    `;
    const pedidosRes = await db.query(query);
    const pedidos = pedidosRes.rows;

    const result = [];
    for (const p of pedidos) {
      const itemsRes = await db.query(`
        SELECT dp.*, pr.nombre as producto_nombre, pr.imagen_url
        FROM detalle_pedidos dp
        JOIN productos pr ON pr.id = dp.producto_id
        WHERE dp.pedido_id = ?
      `, [p.id]);
      result.push({ ...p, items: itemsRes.rows });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pedidos
 */
router.post('/', async (req, res) => {
  try {
    const { mesa_id, items, notas } = req.body;

    if (!mesa_id || !items || !items.length) {
      return res.status(400).json({ error: 'mesa_id e items son requeridos' });
    }

    const mesaRes = await db.query('SELECT * FROM mesas WHERE id = ?', [mesa_id]);
    const mesa = mesaRes.rows[0];
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

    let total = 0;
    const itemsConPrecio = [];
    for (const item of items) {
      const prodRes = await db.query('SELECT * FROM productos WHERE id = ? AND disponible = 1', [item.producto_id]);
      const producto = prodRes.rows[0];
      if (!producto) throw new Error(`Producto ${item.producto_id} no encontrado`);
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      itemsConPrecio.push({ ...item, precio_unitario: producto.precio, subtotal, nombre: producto.nombre });
    }

    let pedidoId;
    if (db.isPostgres) {
      const insPed = await db.query('INSERT INTO pedidos (mesa_id, notas, total) VALUES (?, ?, ?) RETURNING id', [mesa_id, notas || null, total]);
      pedidoId = insPed.rows[0].id;
    } else {
      const insPed = await db.query('INSERT INTO pedidos (mesa_id, notas, total) VALUES (?, ?, ?)', [mesa_id, notas || null, total]);
      pedidoId = insPed.lastID;
    }

    for (const item of itemsConPrecio) {
      await db.query(`
        INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal, item.notas || null]);
    }

    await db.query("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesa_id]);

    const pedidoRes = await db.query(`
      SELECT p.*, m.numero as mesa_numero
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      WHERE p.id = ?
    `, [pedidoId]);
    
    const pedido = pedidoRes.rows[0];
    pedido.items = itemsConPrecio;

    res.status(201).json(pedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/pedidos/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { estado } = req.body;
    const updateSql = db.isPostgres 
      ? "UPDATE pedidos SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      : "UPDATE pedidos SET estado = ?, updated_at = datetime('now', 'localtime') WHERE id = ?";
      
    const result = await db.query(updateSql, [estado, req.params.id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedidoRes = await db.query(`
      SELECT p.*, m.numero as mesa_numero
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      WHERE p.id = ?
    `, [req.params.id]);
    const pedido = pedidoRes.rows[0];

    const itemsRes = await db.query(`
      SELECT dp.*, pr.nombre as producto_nombre
      FROM detalle_pedidos dp
      JOIN productos pr ON pr.id = dp.producto_id
      WHERE dp.pedido_id = ?
    `, [pedido.id]);
    pedido.items = itemsRes.rows;

    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;