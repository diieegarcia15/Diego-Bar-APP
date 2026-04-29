/**
 * Rutas de Mesas
 * GET    /api/mesas          → Listar todas las mesas
 * GET    /api/mesas/:id      → Detalle de mesa con pedidos activos
 * POST   /api/mesas          → Crear nueva mesa
 * DELETE /api/mesas/:id      → Eliminar mesa
 * PATCH  /api/mesas/:id      → Actualizar estado de mesa
 * POST   /api/mesas/:id/cerrar → Cerrar mesa (archivar en historial + resetear)
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/mesas
 * Listar todas las mesas con su estado actual
 */
router.get('/', (req, res) => {
  try {
    const mesas = db.prepare(`
      SELECT m.*,
        (SELECT COUNT(*) FROM pedidos p WHERE p.mesa_id = m.id AND p.estado != 'entregado') as pedidos_activos
      FROM mesas m
      ORDER BY m.numero
    `).all();
    res.json(mesas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mesas/:id
 * Detalle de mesa con sus pedidos activos y detalles
 */
router.get('/:id', (req, res) => {
  try {
    const mesa = db.prepare('SELECT * FROM mesas WHERE id = ?').get(req.params.id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const pedidos = db.prepare(`
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
    `).all(mesa.id);

    // Parse JSON items
    pedidos.forEach(p => {
      p.items = JSON.parse(p.items).filter(i => i.id !== null);
    });

    res.json({ ...mesa, pedidos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mesas
 * Crear una nueva mesa (el número se autoincrementa o se recibe)
 */
router.post('/', (req, res) => {
  try {
    const { numero, sector } = req.body;
    
    // Si no viene número, buscar el siguiente disponible
    let mesaNumero = numero;
    if (!mesaNumero) {
      const lastMesa = db.prepare('SELECT MAX(numero) as maxNum FROM mesas').get();
      mesaNumero = (lastMesa.maxNum || 0) + 1;
    }

    const result = db.prepare('INSERT INTO mesas (numero, sector) VALUES (?, ?)').run(mesaNumero, sector || 'Adentro');
    const mesa = db.prepare('SELECT * FROM mesas WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(mesa);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'El número de mesa ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/mesas/:id
 * Eliminar una mesa (solo si no tiene pedidos activos)
 */
router.delete('/:id', (req, res) => {
  try {
    const mesaId = req.params.id;
    
    // Verificar si tiene pedidos activos
    const activos = db.prepare('SELECT COUNT(*) as count FROM pedidos WHERE mesa_id = ?').get(mesaId);
    if (activos.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una mesa con pedidos activos' });
    }

    const result = db.prepare('DELETE FROM mesas WHERE id = ?').run(mesaId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    res.json({ success: true, message: `Mesa ${mesaId} eliminada` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/mesas/:id
 * Actualizar estado de la mesa
 * Body: { estado: 'disponible' | 'ocupada' | 'por_cobrar' }
 */
router.patch('/:id', (req, res) => {
  try {
    const { estado } = req.body;
    const validEstados = ['disponible', 'ocupada', 'por_cobrar'];
    if (!validEstados.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Usar: ${validEstados.join(', ')}` });
    }

    const result = db.prepare('UPDATE mesas SET estado = ? WHERE id = ?').run(estado, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const mesa = db.prepare('SELECT * FROM mesas WHERE id = ?').get(req.params.id);
    res.json(mesa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mesas/:id/cerrar
 * Cerrar mesa: guarda pedidos en historial, elimina pedidos activos, resetea estado
 * Body: { metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' }
 */
router.post('/:id/cerrar', (req, res) => {
  try {
    const mesa = db.prepare('SELECT * FROM mesas WHERE id = ?').get(req.params.id);
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const { metodo_pago } = req.body || {};

    // Obtener todos los pedidos activos de la mesa
    const pedidos = db.prepare(`
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
    `).all(mesa.id);

    // Transacción atómica: archivar → eliminar → resetear
    const cerrarMesa = db.transaction(() => {
      // 1. Guardar cada pedido en historial
      const insertHistorial = db.prepare(`
        INSERT INTO historial_pedidos (mesa_numero, pedido_original_id, detalle, total, metodo_pago)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const pedido of pedidos) {
        const items = JSON.parse(pedido.items).filter(i => i.producto_id !== null);
        const detalle = JSON.stringify({
          pedido_id: pedido.id,
          estado: pedido.estado,
          notas: pedido.notas,
          items: items,
          created_at: pedido.created_at,
        });
        insertHistorial.run(mesa.numero, pedido.id, detalle, pedido.total, metodo_pago || 'no_especificado');
      }

      // 2. Eliminar detalles y pedidos
      db.prepare('DELETE FROM detalle_pedidos WHERE pedido_id IN (SELECT id FROM pedidos WHERE mesa_id = ?)').run(mesa.id);
      db.prepare('DELETE FROM pedidos WHERE mesa_id = ?').run(mesa.id);

      // 3. Resetear estado de la mesa
      db.prepare("UPDATE mesas SET estado = 'disponible' WHERE id = ?").run(mesa.id);
    });

    cerrarMesa();

    const mesaActualizada = db.prepare('SELECT * FROM mesas WHERE id = ?').get(mesa.id);
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
