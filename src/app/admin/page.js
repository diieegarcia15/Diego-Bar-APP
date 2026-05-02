'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import OrderCard from '@/components/admin/OrderCard';
import OrderBoard from '@/components/admin/OrderBoard';
import MesaPanel from '@/components/admin/MesaPanel';
import HistorialView from '@/components/admin/HistorialView';
import DetalleMesaModal from '@/components/admin/DetalleMesaModal';
import Header from '@/components/shared/Header';
import MenuEditor from '@/components/admin/MenuEditor';
import ConfirmModal from '@/components/shared/ConfirmModal';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ usuario: '', password: '' });
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [stats, setStats] = useState({ total: 0, activos: 0 });
  const [showHistorial, setShowHistorial] = useState(false);
  const [selectedMesaId, setSelectedMesaId] = useState(null);
  const [activeTab, setActiveTab] = useState('tablero');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, mesaId: null });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.verifyToken().then(() => setIsLoggedIn(true)).catch(() => localStorage.removeItem('admin_token'));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const socket = getSocket();
      socket.on('pedido_recibido', (nuevoPedido) => {
        setPedidos(prev => [nuevoPedido, ...prev]);
        loadData();
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
      });
      socket.on('pedido_actualizado', () => loadData());
      socket.on('mesa_actualizada', (data) => {
        if (data?.estado === 'por_cobrar') new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        loadData();
      });
      return () => {
        socket.off('pedido_recibido');
        socket.off('pedido_actualizado');
        socket.off('mesa_actualizada');
      };
    }
  }, [isLoggedIn]);

  async function loadData() {
    try {
      const [pedidosData, mesasData] = await Promise.all([api.getPedidos(), api.getMesas()]);
      setPedidos(pedidosData.filter(p => p.estado !== 'entregado'));
      setMesas(mesasData);
      const totalRecaudado = pedidosData.reduce((acc, p) => acc + p.total, 0);
      setStats({ total: totalRecaudado, activos: pedidosData.length });
    } catch (err) { console.error(err); }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(loginData);
      localStorage.setItem('admin_token', res.token);
      setIsLoggedIn(true);
    } catch (err) { alert('❌ Error: ' + err.message); }
  };

  const updatePedidoEstado = async (id, nuevoEstado) => {
    try {
      await api.actualizarPedido(id, { estado: nuevoEstado });
      getSocket().emit('actualizar_pedido', { id, estado: nuevoEstado });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleCerrarMesa = async (mesaId) => {
    try {
      await api.cerrarMesa(mesaId, { metodo_pago: 'efectivo' });
      getSocket().emit('mesa_update', { id: mesaId, estado: 'disponible' });
      loadData();
      return true;
    } catch (err) { alert(err.message); return false; }
  };

  const handleAgregarMesa = async (sector) => {
    try { await api.crearMesa({ sector }); loadData(); } catch (err) { alert(err.message); }
  };

  const handleEliminarMesa = async (id) => { setDeleteConfirm({ isOpen: true, mesaId: id }); };
  const confirmEliminarMesa = async () => {
    try { await api.eliminarMesa(deleteConfirm.mesaId); loadData(); } catch (err) { alert(err.message); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <form onSubmit={handleLogin} className="glass-card p-8 rounded-3xl w-full max-w-md space-y-6 text-white">
          <h1 className="text-3xl font-bold text-center">💻 Computadora Maestra</h1>
          <input type="text" placeholder="Usuario" className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl" onChange={e => setLoginData({...loginData, usuario: e.target.value})} />
          <input type="password" placeholder="Contraseña" className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl" onChange={e => setLoginData({...loginData, password: e.target.value})} />
          <button className="w-full bg-accent text-dark-900 py-4 rounded-xl font-bold hover:shadow-glow-green">INGRESAR</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-dark-900">
      <OrderBoard orders={pedidos} onUpdateStatus={updatePedidoEstado} />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto h-screen custom-scrollbar">
        <Header 
          title={activeTab === 'tablero' ? "PLANO DEL SALÓN" : "EDITOR DE MENÚ"} 
          rightElement={
            <div className="flex gap-4">
              <button onClick={() => setActiveTab('tablero')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'tablero' ? 'bg-accent text-dark-900' : 'glass-card text-white'}`}>🏠 SALÓN</button>
              <button onClick={() => setActiveTab('menu')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'menu' ? 'bg-accent text-dark-900' : 'glass-card text-white'}`}>🍔 MENÚ</button>
              <button onClick={() => setShowHistorial(true)} className="glass-card px-4 py-2 rounded-xl text-xs font-bold text-white">📜 HISTORIAL</button>
            </div>
          }
        />
        {activeTab === 'tablero' ? (
          <MesaPanel mesas={mesas} onMesaClick={setSelectedMesaId} onAddMesa={handleAgregarMesa} onDeleteMesa={handleEliminarMesa} />
        ) : (
          <MenuEditor />
        )}
      </main>
      <DetalleMesaModal mesaId={selectedMesaId} isOpen={!!selectedMesaId} onClose={() => setSelectedMesaId(null)} onUpdateMesa={loadData} onCerrarMesa={handleCerrarMesa} />
      <HistorialView isOpen={showHistorial} onClose={() => setShowHistorial(false)} />
      <ConfirmModal isOpen={deleteConfirm.isOpen} title="¿Eliminar Mesa?" onConfirm={confirmEliminarMesa} onClose={() => setDeleteConfirm({ isOpen: false, mesaId: null })} />
    </div>
  );
}
