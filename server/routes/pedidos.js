/**
 * Rutas de Pedidos (Compatible SQLite/PostgreSQL)
 * - Validación estricta de inputs
 * - Transacciones atómicas para integridad de datos
 * POST / — público (clientes de mesa crean pedidos sin login)
 * GET / y PATCH /:id — protegidos (solo admin)
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('./auth');

/**
 * Valida y sanitiza los items de un pedido entrante.
 * Lanza un Error con mensaje descriptivo si algo es inválido.
 */
function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El pedido debe contener al menos un item.');
  }
  if (items.length > 50) {
    throw new Error('Un pedido no puede tener más de 50 items distintos.');
  }
  for (const item of items) {
    const productoId = parseInt(item.producto_id, 10);
    const cantidad = parseInt(item.cantidad, 10);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      throw new Error(`producto_id inválido: ${item.producto_id}`);
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 99) {
      throw new Error(`cantidad inválida para producto ${productoId}: debe ser entre 1 y 99.`);
    }
    // Sanear notas: solo string corto o null
    if (item.notas !== undefined && item.notas !== null) {
      if (typeof item.notas !== 'string') throw new Error('notas debe ser un texto.');
      if (item.notas.length > 300) throw new Error('Las notas no pueden superar 300 caracteres.');
    }
  }
}

/**
 * GET /api/pedidos — Protegido
 * Lista todos los pedidos activos. Solo el admin lo necesita.
 * Usa un solo JOIN agregado para evitar el N+1 query problem.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = db.isPostgres ? `
      SELECT p.*, m.numero as mesa_numero,
        COALESCE(json_agg(
          json_build_object(
            'id', dp.id,
            'producto_id', dp.producto_id,
            'producto_nombre', pr.nombre,
            'imagen_url', pr.imagen_url,
            'cantidad', dp.cantidad,
            'precio_unitario', dp.precio_unitario,
            'subtotal', dp.subtotal,
            'notas', dp.notas
          )
        ) FILTER (WHERE dp.id IS NOT NULL), '[]') as items
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
      LEFT JOIN productos pr ON pr.id = dp.producto_id
      GROUP BY p.id, m.numero
      ORDER BY p.created_at DESC
    ` : `
      SELECT p.*, m.numero as mesa_numero,
        json_group_array(
          json_object(
            'id', dp.id,
            'producto_id', dp.producto_id,
            'producto_nombre', pr.nombre,
            'imagen_url', pr.imagen_url,
            'cantidad', dp.cantidad,
            'precio_unitario', dp.precio_unitario,
            'subtotal', dp.subtotal,
            'notas', dp.notas
          )
        ) as items
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
      LEFT JOIN productos pr ON pr.id = dp.producto_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const pedidosRes = await db.query(query);
    const pedidos = pedidosRes.rows.map(p => ({
      ...p,
      items: typeof p.items === 'string'
        ? JSON.parse(p.items).filter(i => i.id !== null)
        : (Array.isArray(p.items) ? p.items.filter(i => i.id !== null) : []),
    }));

    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pedidos
 * Crea un pedido con transacción atómica para garantizar integridad de datos.
 */
router.post('/', async (req, res) => {
  try {
    const { mesa_id, items, notas } = req.body;

    // --- Validación de mesa_id ---
    const mesaIdInt = parseInt(mesa_id, 10);
    if (!Number.isInteger(mesaIdInt) || mesaIdInt <= 0) {
      return res.status(400).json({ error: 'mesa_id debe ser un número entero positivo.' });
    }

    // --- Validación de items ---
    try {
      validateItems(items);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    // --- Validación de notas opcionales ---
    if (notas !== undefined && notas !== null) {
      if (typeof notas !== 'string' || notas.length > 500) {
        return res.status(400).json({ error: 'Las notas del pedido no pueden superar 500 caracteres.' });
      }
    }

    const mesaRes = await db.query('SELECT * FROM mesas WHERE id = ?', [mesaIdInt]);
    const mesa = mesaRes.rows[0];
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

    // --- Pre-calcular precios y validar productos ANTES de iniciar transacción ---
    let total = 0;
    const itemsConPrecio = [];
    for (const item of items) {
      const prodId = parseInt(item.producto_id, 10);
      const cantidad = parseInt(item.cantidad, 10);
      const prodRes = await db.query('SELECT * FROM productos WHERE id = ? AND disponible = 1', [prodId]);
      const producto = prodRes.rows[0];
      if (!producto) return res.status(404).json({ error: `Producto ${prodId} no encontrado o no disponible.` });
      const subtotal = parseFloat((producto.precio * cantidad).toFixed(2));
      total += subtotal;
      itemsConPrecio.push({
        producto_id: prodId,
        cantidad,
        precio_unitario: producto.precio,
        subtotal,
        nombre: producto.nombre,
        notas: item.notas || null,
      });
    }
    total = parseFloat(total.toFixed(2));

    // =====================================================================
    // TRANSACCIÓN ATÓMICA: si cualquier INSERT falla, se hace rollback total
    // =====================================================================
    let pedidoId;

    if (db.isPostgres) {
      // Transacción en PostgreSQL
      await db.query('BEGIN');
      try {
        const insPed = await db.query(
          'INSERT INTO pedidos (mesa_id, notas, total) VALUES (?, ?, ?) RETURNING id',
          [mesaIdInt, notas || null, total]
        );
        pedidoId = insPed.rows[0].id;

        for (const item of itemsConPrecio) {
          await db.query(
            'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas) VALUES (?, ?, ?, ?, ?, ?)',
            [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal, item.notas]
          );
        }
        await db.query("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesaIdInt]);
        await db.query('COMMIT');
      } catch (txError) {
        await db.query('ROLLBACK');
        throw txError;
      }
    } else {
      // Transacción en SQLite usando API síncrona de better-sqlite3
      const insertPedido = db.prepare('INSERT INTO pedidos (mesa_id, notas, total) VALUES (?, ?, ?)');
      const insertDetalle = db.prepare(
        'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas) VALUES (?, ?, ?, ?, ?, ?)'
      );
      const updateMesa = db.prepare("UPDATE mesas SET estado = 'ocupada' WHERE id = ?");

      const runTransaction = db.sqlite.transaction(() => {
        const info = insertPedido.run([mesaIdInt, notas || null, total]);
        const localPedidoId = info.lastInsertRowid;
        for (const item of itemsConPrecio) {
          insertDetalle.run([localPedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal, item.notas]);
        }
        updateMesa.run([mesaIdInt]);
        return localPedidoId;
      });
      pedidoId = runTransaction();
    }

    // Retornar el pedido recién creado y notificar via WebSocket desde el servidor
    const pedidoRes = await db.query(
      'SELECT p.*, m.numero as mesa_numero FROM pedidos p JOIN mesas m ON m.id = p.mesa_id WHERE p.id = ?',
      [pedidoId]
    );
    const pedido = pedidoRes.rows[0];
    pedido.items = itemsConPrecio;

    // Emitir desde el servidor elimina la necesidad de que el cliente emita manualmente
    // Esto previene notificaciones duplicadas y centraliza la lógica de eventos
    const io = req.app.get('io');
    if (io) io.emit('pedido_recibido', pedido);

    res.status(201).json(pedido);
  } catch (err) {
    console.error('[POST /api/pedidos] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/pedidos/:id — Protegido
 * Solo el admin/cocina puede cambiar el estado de un pedido.
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['recibido', 'en_preparacion', 'listo', 'entregado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` });
    }

    const pedidoId = parseInt(req.params.id, 10);
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return res.status(400).json({ error: 'ID de pedido inválido.' });
    }

    const updateSql = db.isPostgres 
      ? "UPDATE pedidos SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      : "UPDATE pedidos SET estado = ?, updated_at = datetime('now', 'localtime') WHERE id = ?";
      
    const result = await db.query(updateSql, [estado, pedidoId]);

    // SQLite devuelve rowCount como 'changes', Postgres como 'rowCount'
    const affectedRows = result.rowCount ?? result.changes ?? 0;
    if (affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedidoRes = await db.query(
      'SELECT p.*, m.numero as mesa_numero FROM pedidos p JOIN mesas m ON m.id = p.mesa_id WHERE p.id = ?',
      [pedidoId]
    );
    const pedido = pedidoRes.rows[0];

    const itemsRes = await db.query(
      'SELECT dp.*, pr.nombre as producto_nombre FROM detalle_pedidos dp JOIN productos pr ON pr.id = dp.producto_id WHERE dp.pedido_id = ?',
      [pedido.id]
    );
    pedido.items = itemsRes.rows;

    res.json(pedido);
  } catch (err) {
    console.error('[PATCH /api/pedidos/:id] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;