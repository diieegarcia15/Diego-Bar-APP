'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

/**
 * useAdminMesas
 * Encapsula todas las operaciones de mesas del panel de administración.
 *
 * Responsabilidades:
 *  - Abrir/cerrar el modal de detalle de mesa.
 *  - Gestionar el modal de confirmación de eliminación.
 *  - Ejecutar: cerrar mesa, agregar mesa, eliminar mesa.
 *  - Emitir eventos WebSocket después de cada operación.
 *
 * @param {Function} loadData - Callback para recargar el estado global tras cada operación.
 * @returns {{ selectedMesaId, deleteConfirm, handlers }}
 */
export function useAdminMesas(loadData) {
  const [selectedMesaId, setSelectedMesaId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, mesaId: null });

  /**
   * Cierra la mesa: archiva pedidos al historial, libera el estado.
   * Emite 'mesa_update' via WebSocket para notificar a otros clientes.
   * @returns {boolean} true si tuvo éxito, false si falló.
   */
  const handleCerrarMesa = async (mesaId) => {
    try {
      await api.cerrarMesa(mesaId, { metodo_pago: 'efectivo' });
      getSocket().emit('mesa_update', { id: mesaId, estado: 'disponible' });
      loadData();
      return true;
    } catch (err) {
      console.error('[useAdminMesas] Error al cerrar mesa:', err);
      return false;
    }
  };

  /**
   * Agrega una nueva mesa en el sector indicado.
   */
  const handleAgregarMesa = async (sector) => {
    try {
      await api.crearMesa({ sector });
      loadData();
    } catch (err) {
      alert('No se pudo agregar la mesa. Intentá de nuevo.');
    }
  };

  /**
   * Abre el modal de confirmación antes de eliminar.
   */
  const handleEliminarMesa = (id) => {
    setDeleteConfirm({ isOpen: true, mesaId: id });
  };

  /**
   * Confirma y ejecuta la eliminación de la mesa seleccionada.
   */
  const confirmEliminarMesa = async () => {
    try {
      await api.eliminarMesa(deleteConfirm.mesaId);
      setDeleteConfirm({ isOpen: false, mesaId: null });
      loadData();
    } catch (err) {
      alert('No se pudo eliminar la mesa.');
    }
  };

  const cancelEliminarMesa = () => {
    setDeleteConfirm({ isOpen: false, mesaId: null });
  };

  return {
    selectedMesaId,
    setSelectedMesaId,
    deleteConfirm,
    handleCerrarMesa,
    handleAgregarMesa,
    handleEliminarMesa,
    confirmEliminarMesa,
    cancelEliminarMesa,
  };
}
