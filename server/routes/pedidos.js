/**
 * Rutas de Pedidos
 * GET  /api/pedidos       → Listar pedidos activos (para admin)
 * POST /api/pedidos       → Crear nuevo pedido (desde cliente)
 * PATCH /api/pedidos/:id  → Cambiar estado del pedido
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/pedidos
 * Listar todos los pedidos activos con sus items
 */
router.get('/', (req, res) => {
  try {
    const pedidos = db.prepare(`
      SELECT p.*, m.numero as mesa_numero
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      ORDER BY p.created_at DESC
    `).all();

    // Obtener items de cada pedido
    const getItems = db.prepare(`
      SELECT dp.*, pr.nombre as producto_nombre, pr.imagen_url
      FROM detalle_pedidos dp
      JOIN productos pr ON pr.id = dp.producto_id
      WHERE dp.pedido_id = ?
    `);

    const result = pedidos.map(p => ({
      ...p,
      items: getItems.all(p.id)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pedidos
 * Crear un nuevo pedido
 * Body: { mesa_id, items: [{ producto_id, cantidad, notas? }], notas? }
 */
router.post('/', (req, res) => {
  try {
    const { mesa_id, items, notas } = req.body;

    if (!mesa_id || !items || !items.length) {
      return res.status(400).json({ error: 'mesa_id e items son requeridos' });
    }

    // Verificar que la mesa existe
    const mesa = db.prepare('SELECT * FROM mesas WHERE id = ?').get(mesa_id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    // Calcular total
    const getProducto = db.prepare('SELECT * FROM productos WHERE id = ? AND disponible = 1');
    let total = 0;
    const itemsConPrecio = items.map(item => {
      const producto = getProducto.get(item.producto_id);
      if (!producto) {
        throw new Error(`Producto ${item.producto_id} no encontrado o no disponible`);
      }
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      return { ...item, precio_unitario: producto.precio, subtotal, nombre: producto.nombre };
    });

    // Transacción: crear pedido + detalles + actualizar mesa
    const crearPedido = db.transaction(() => {
      // Insertar pedido
      const result = db.prepare(`
        INSERT INTO pedidos (mesa_id, notas, total) VALUES (?, ?, ?)
      `).run(mesa_id, notas || null, total);

      const pedidoId = result.lastInsertRowid;

      // Insertar items del pedido
      const insertItem = db.prepare(`
        INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of itemsConPrecio) {
        insertItem.run(pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal, item.notas || null);
      }

      // Actualizar estado de la mesa a 'ocupada'
      db.prepare("UPDATE mesas SET estado = 'ocupada' WHERE id = ?").run(mesa_id);

      return pedidoId;
    });

    const pedidoId = crearPedido();

    // Obtener el pedido completo para retornar
    const pedido = db.prepare(`
      SELECT p.*, m.numero as mesa_numero
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      WHERE p.id = ?
    `).get(pedidoId);

    pedido.items = itemsConPrecio;

    res.status(201).json(pedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/pedidos/:id
 * Actualizar estado del pedido
 * Body: { estado: 'recibido' | 'en_preparacion' | 'listo' | 'entregado' }
 */
router.patch('/:id', (req, res) => {
  try {
    const { estado } = req.body;
    const validEstados = ['recibido', 'en_preparacion', 'listo', 'entregado'];
    if (!validEstados.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Usar: ${validEstados.join(', ')}` });
    }

    const result = db.prepare(`
      UPDATE pedidos SET estado = ?, updated_at = datetime('now', 'localtime') WHERE id = ?
    `).run(estado, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = db.prepare(`
      SELECT p.*, m.numero as mesa_numero
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      WHERE p.id = ?
    `).get(req.params.id);

    // Obtener items
    pedido.items = db.prepare(`
      SELECT dp.*, pr.nombre as producto_nombre
      FROM detalle_pedidos dp
      JOIN productos pr ON pr.id = dp.producto_id
      WHERE dp.pedido_id = ?
    `).all(pedido.id);

    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
