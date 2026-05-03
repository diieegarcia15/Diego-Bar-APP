/**
 * Rutas de Mesas (Compatible SQLite/PostgreSQL)
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/mesas
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT m.*,
        (SELECT COUNT(*) FROM pedidos p WHERE p.mesa_id = m.id AND p.estado != 'entregado') as pedidos_activos
      FROM mesas m
      ORDER BY m.numero
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mesas/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const mesaRes = await db.query('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    const mesa = mesaRes.rows[0];
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

    let query;
    if (db.isPostgres) {
      query = `
        SELECT p.*,
          COALESCE(json_agg(
            json_build_object(
              'id', dp.id,
              'producto_id', dp.producto_id,
              'nombre', pr.nombre,
              'cantidad', dp.cantidad,
              'precio_unitario', dp.precio_unitario,
              'subtotal', dp.subtotal,
              'notas', dp.notas
            )
          ) FILTER (WHERE dp.id IS NOT NULL), '[]') as items
        FROM pedidos p
        LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
        LEFT JOIN productos pr ON pr.id = dp.producto_id
        WHERE p.mesa_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;
    } else {
      query = `
        SELECT p.*,
          json_group_array(
            json_object(
              'id', dp.id,
              'producto_id', dp.producto_id,
              'nombre', pr.nombre,
              'cantidad', dp.cantidad,
              'precio_unitario', dp.precio_unitario,
              'subtotal', dp.subtotal,
              'notas', dp.notas
            )
          ) as items
        FROM pedidos p
        LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
        LEFT JOIN productos pr ON pr.id = dp.producto_id
        WHERE p.mesa_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;
    }

    const result = await db.query(query, [mesa.id]);
    const pedidos = result.rows;

    pedidos.forEach(p => {
      if (typeof p.items === 'string') {
        p.items = JSON.parse(p.items).filter(i => i.id !== null);
      } else if (!p.items) {
        p.items = [];
      } else {
        p.items = p.items.filter(i => i.id !== null);
      }
    });

    res.json({ ...mesa, pedidos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mesas
 */
router.post('/', async (req, res) => {
  try {
    const { numero, sector } = req.body;
    let mesaNumero = numero;
    if (!mesaNumero) {
      const lastRes = await db.query('SELECT MAX(numero) as "maxNum" FROM mesas');
      mesaNumero = (parseInt(lastRes.rows[0].maxNum) || 0) + 1;
    }

    let result;
    if (db.isPostgres) {
      result = await db.query('INSERT INTO mesas (numero, sector) VALUES (?, ?) RETURNING id', [mesaNumero, sector || 'Adentro']);
    } else {
      result = await db.query('INSERT INTO mesas (numero, sector) VALUES (?, ?)', [mesaNumero, sector || 'Adentro']);
    }

    const lastId = db.isPostgres ? result.rows[0].id : result.lastID;
    const mesa = (await db.query('SELECT * FROM mesas WHERE id = ?', [lastId])).rows[0];
    res.status(201).json(mesa);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'El número de mesa ya existe' });
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/mesas/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const mesaId = req.params.id;
    const activosRes = await db.query('SELECT COUNT(*) FROM pedidos WHERE mesa_id = ?', [mesaId]);
    const activos = activosRes.rows[0].count;
    if (parseInt(activos) > 0) return res.status(400).json({ error: 'No se puede eliminar una mesa con pedidos activos' });

    const result = await db.query('DELETE FROM mesas WHERE id = ?', [mesaId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Mesa no encontrada' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/mesas/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { estado } = req.body;
    const result = await db.query('UPDATE mesas SET estado = ? WHERE id = ?', [estado, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Mesa no encontrada' });
    const mesaRes = await db.query('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    const mesa = mesaRes.rows[0];
    res.json(mesa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mesas/:id/cerrar
 */
router.post('/:id/cerrar', async (req, res) => {
  try {
    const mesaRes = await db.query('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    const mesa = mesaRes.rows[0];
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

    const { metodo_pago } = req.body || {};

    let query;
    if (db.isPostgres) {
      query = `
        SELECT p.*,
          COALESCE(json_agg(
            json_build_object(
              'producto_id', dp.producto_id,
              'nombre', pr.nombre,
              'cantidad', dp.cantidad,
              'precio_unitario', dp.precio_unitario,
              'subtotal', dp.subtotal
            )
          ) FILTER (WHERE dp.id IS NOT NULL), '[]') as items
        FROM pedidos p
        LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
        LEFT JOIN productos pr ON pr.id = dp.producto_id
        WHERE p.mesa_id = ?
        GROUP BY p.id
      `;
    } else {
      query = `
        SELECT p.*,
          json_group_array(
            json_object(
              'producto_id', dp.producto_id,
              'nombre', pr.nombre,
              'cantidad', dp.cantidad,
              'precio_unitario', dp.precio_unitario,
              'subtotal', dp.subtotal
            )
          ) as items
        FROM pedidos p
        LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
        LEFT JOIN productos pr ON pr.id = dp.producto_id
        WHERE p.mesa_id = ?
        GROUP BY p.id
      `;
    }

    const pedidosRes = await db.query(query, [mesa.id]);
    const pedidos = pedidosRes.rows;

    for (const pedido of pedidos) {
      let items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items;
      items = items.filter(i => i.producto_id !== null);
      
      const detalle = JSON.stringify({
        pedido_id: pedido.id,
        estado: pedido.estado,
        notas: pedido.notas,
        items: items,
        created_at: pedido.created_at,
      });

      await db.query(`
        INSERT INTO historial_pedidos (mesa_numero, pedido_original_id, detalle, total, metodo_pago)
        VALUES (?, ?, ?, ?, ?)
      `, [mesa.numero, pedido.id, detalle, pedido.total, metodo_pago || 'no_especificado']);
    }

    await db.query('DELETE FROM detalle_pedidos WHERE pedido_id IN (SELECT id FROM pedidos WHERE mesa_id = ?)', [mesa.id]);
    await db.query('DELETE FROM pedidos WHERE mesa_id = ?', [mesa.id]);
    await db.query("UPDATE mesas SET estado = 'disponible' WHERE id = ?", [mesa.id]);

    const mesaActualizadaRes = await db.query('SELECT * FROM mesas WHERE id = ?', [mesa.id]);
    const mesaActualizada = mesaActualizadaRes.rows[0];
    res.json({
      message: `Mesa ${mesa.numero} cerrada exitosamente`,
      mesa: mesaActualizada,
      pedidos_archivados: pedidos.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;