'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMesas } from '@/hooks/useAdminMesas';
import OrderBoard from '@/components/admin/OrderBoard';
import MesaPanel from '@/components/admin/MesaPanel';
import HistorialView from '@/components/admin/HistorialView';
import DetalleMesaModal from '@/components/admin/DetalleMesaModal';
import Header from '@/components/shared/Header';
import MenuEditor from '@/components/admin/MenuEditor';
import ConfirmModal from '@/components/shared/ConfirmModal';

/**
 * AdminPage
 * Componente de página del panel de administración.
 *
 * La lógica de negocio está delegada a Custom Hooks:
 *  - useAdminAuth  → autenticación (login / logout / verificación de sesión)
 *  - useAdminData  → carga de datos + WebSockets + reconexión automática
 *  - useAdminMesas → operaciones de mesas (cerrar, agregar, eliminar)
 *
 * Este componente solo se ocupa del estado de UI (tabs, modales) y del renderizado.
 */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('tablero');
  const [showHistorial, setShowHistorial] = useState(false);

  // --- Auth ---
  const { isLoggedIn, loginData, setLoginData, handleLogin, handleLogout } = useAdminAuth();

  // --- Datos + WebSockets ---
  const { pedidos, mesas, loadData, setPedidos } = useAdminData(isLoggedIn);

  // --- Operaciones de mesas ---
  const {
    selectedMesaId, setSelectedMesaId,
    deleteConfirm,
    handleCerrarMesa, handleAgregarMesa,
    handleEliminarMesa, confirmEliminarMesa, cancelEliminarMesa,
  } = useAdminMesas(loadData);

  // Actualización optimista de estado de pedido con rollback si falla
  const updatePedidoEstado = async (id, nuevoEstado) => {
    try {
      setPedidos(prev =>
        prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p)
            .filter(p => p.estado !== 'entregado')
      );
      await api.actualizarPedido(id, { estado: nuevoEstado });
      getSocket().emit('actualizar_pedido', { id, estado: nuevoEstado });
    } catch (err) {
      loadData(); // Rollback: restaurar estado real desde el servidor
    }
  };

  // ── Login Screen ─────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <form onSubmit={handleLogin} className="glass-card p-8 rounded-3xl w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-center">Admin Access</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Usuario"
              className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl outline-none"
              onChange={e => setLoginData({ ...loginData, usuario: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl outline-none"
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
            />
            <button className="w-full bg-accent text-dark-900 py-4 rounded-xl font-bold">
              INGRESAR
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-dark-900 text-white font-[family-name:var(--font-pt-sans-narrow)] uppercase">

      {/* Panel lateral: tablero de pedidos en tiempo real */}
      <OrderBoard orders={pedidos} onUpdateStatus={updatePedidoEstado} />

      {/* Área central: plano del salón o editor de menú */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto h-screen custom-scrollbar">
        <Header
          title={activeTab === 'tablero' ? 'PLANO DEL SALON' : 'GESTION DE MENU'}
          subtitle="Diego Bar Control Panel"
          rightElement={
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tablero')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold border ${activeTab === 'tablero' ? 'bg-accent text-dark-900 border-accent' : 'bg-white/5 border-white/5 text-gray-400'}`}
              >SALON</button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold border ${activeTab === 'menu' ? 'bg-accent text-dark-900 border-accent' : 'bg-white/5 border-white/5 text-gray-400'}`}
              >MENU</button>
              <button
                onClick={() => setShowHistorial(true)}
                className="bg-white/5 border border-white/5 px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400"
              >HISTORIAL</button>
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
              >SALIR</button>
            </div>
          }
        />

        {activeTab === 'tablero' ? (
          <MesaPanel
            mesas={mesas}
            onMesaClick={id => setSelectedMesaId(id)}
            onAddMesa={handleAgregarMesa}
            onDeleteMesa={handleEliminarMesa}
          />
        ) : (
          <MenuEditor />
        )}
      </main>

      {/* Modales */}
      <DetalleMesaModal
        mesaId={selectedMesaId}
        isOpen={!!selectedMesaId}
        onClose={() => setSelectedMesaId(null)}
        onUpdateMesa={loadData}
        onCerrarMesa={handleCerrarMesa}
      />
      <HistorialView isOpen={showHistorial} onClose={() => setShowHistorial(false)} />
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Mesa"
        message="¿Seguro que querés eliminar esta mesa?"
        onConfirm={confirmEliminarMesa}
        onClose={cancelEliminarMesa}
      />
    </div>
  );
}
