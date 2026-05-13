'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { getSocket, onReconnect } from '@/lib/socket';

/**
 * useAdminData
 * Encapsula la carga de datos del panel admin y toda la lógica de WebSockets.
 *
 * Responsabilidades:
 *  - Cargar pedidos y mesas desde la API.
 *  - Escuchar eventos de Socket.IO: pedido_recibido, pedido_actualizado, mesa_actualizada.
 *  - Re-sincronizar datos automáticamente al reconectarse al WebSocket.
 *  - Reproducir sonido de notificación al recibir un pedido nuevo.
 *  - Limpiar listeners al desmontar (evitar memory leaks).
 *
 * @param {boolean} isLoggedIn - Solo activa sockets y carga de datos si es true.
 * @returns {{ pedidos, mesas, stats, loadData }}
 */
export function useAdminData(isLoggedIn) {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0 });
  const audioRef = useRef(null);

  // Inicializar el elemento de audio una sola vez al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.load();
    }
  }, []);

  /**
   * Carga pedidos y mesas en paralelo con Promise.all.
   * Estable entre renders gracias a useCallback con dependencias vacías.
   */
  const loadData = useCallback(async () => {
    try {
      const [pedidosData, mesasData] = await Promise.all([
        api.getPedidos(),
        api.getMesas(),
      ]);
      setPedidos(pedidosData.filter(p => p.estado !== 'entregado'));
      setMesas(mesasData);
      const totalRecaudado = pedidosData.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
      setStats({ total: totalRecaudado, activos: pedidosData.length });
    } catch (err) {
      console.error('[useAdminData] Error al cargar datos:', err);
    }
  }, []);

  /**
   * Configura WebSockets cuando el admin está autenticado.
   * - Normaliza el payload de pedido_recibido para unificar campo 'nombre'/'producto_nombre'.
   * - Llama loadData() en cada evento para garantizar consistencia con el servidor.
   * - onReconnect llama loadData() para recuperar eventos perdidos durante desconexión.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    loadData();
    const socket = getSocket();

    const handleNuevoPedido = (pedidoRaw) => {
      const pedidoNormalizado = {
        ...pedidoRaw,
        items: (pedidoRaw.items || []).map(item => ({
          ...item,
          producto_nombre: item.producto_nombre || item.nombre,
        })),
      };
      // Actualización atómica: añadir al principio, sin duplicados
      setPedidos(prev => {
        const existe = prev.some(p => p.id === pedidoNormalizado.id);
        if (existe) return prev;
        return [pedidoNormalizado, ...prev];
      });
      setMesas(prev => prev.map(m =>
        m.id === pedidoNormalizado.mesa_id ? { ...m, estado: 'ocupada' } : m
      ));
      if (audioRef.current) audioRef.current.play().catch(() => {});
    };

    const handlePedidoActualizado = (data) => {
      setPedidos(prev => prev.map(p => 
        p.id === data.id ? { ...p, ...data } : p
      ).filter(p => p.estado !== 'entregado'));
    };

    const handleMesaActualizada = (data) => {
      setMesas(prev => prev.map(m => 
        m.id === data.id ? { ...m, ...data } : m
      ));
    };

    const handleMesaCerrada = (data) => {
      setMesas(prev => prev.map(m => 
        m.id === data.id ? { ...m, estado: 'disponible' } : m
      ));
      setPedidos(prev => prev.filter(p => p.mesa_id !== data.id));
    };

    socket.on('pedido_recibido', handleNuevoPedido);
    socket.on('pedido_actualizado', handlePedidoActualizado);
    socket.on('mesa_actualizada', handleMesaActualizada);
    socket.on('mesa_cerrada', handleMesaCerrada);

    // Re-sincronizar al reconectarse: evita pedidos perdidos durante desconexiones breves
    const cleanupReconnect = onReconnect(() => {
      console.log('[Admin] Socket reconectado — resincronizando datos...');
      loadData();
    });

    return () => {
      socket.off('pedido_recibido', handleNuevoPedido);
      socket.off('pedido_actualizado', handlePedidoActualizado);
      socket.off('mesa_actualizada', handleMesaActualizada);
      socket.off('mesa_cerrada', handleMesaCerrada);
      cleanupReconnect();
    };
  }, [isLoggedIn, loadData]);

  return { pedidos, mesas, stats, loadData, setPedidos, setMesas };
}
