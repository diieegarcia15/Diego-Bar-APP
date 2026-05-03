'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
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

  const audioRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [pedidosData, mesasData] = await Promise.all([
        api.getPedidos(),
        api.getMesas()
      ]);
      setPedidos(pedidosData.filter(p => p.estado !== 'entregado'));
      setMesas(mesasData);
      const totalRecaudado = pedidosData.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
      setStats({ total: totalRecaudado, activos: pedidosData.length });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.load();
    }
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.verifyToken().then(() => setIsLoggedIn(true)).catch(() => localStorage.removeItem('admin_token'));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const socket = getSocket();
      const handleNuevoPedido = (pedidoRaw) => {
        const pedidoNormalizado = {
          ...pedidoRaw,
          items: (pedidoRaw.items || []).map(item => ({
            ...item,
            producto_nombre: item.producto_nombre || item.nombre
          }))
        };
        setPedidos(prev => [pedidoNormalizado, ...prev.filter(p => p.id !== pedidoNormalizado.id)]);
        setMesas(prev => prev.map(m => m.id === pedidoNormalizado.mesa_id ? { ...m, estado: 'ocupada' } : m));
        if (audioRef.current) audioRef.current.play().catch(() => {});
        loadData();
      };
      socket.on('pedido_recibido', handleNuevoPedido);
      socket.on('pedido_actualizado', () => loadData());
      socket.on('mesa_actualizada', () => loadData());
      return () => {
        socket.off('pedido_recibido', handleNuevoPedido);
        socket.off('pedido_actualizado');
        socket.off('mesa_actualizada');
      };
    }
  }, [isLoggedIn, loadData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(loginData);
      localStorage.setItem('admin_token', res.token);
      setIsLoggedIn(true);
    } catch (err) {
      alert('Error de acceso');
    }
  };

  const updatePedidoEstado = async (id, nuevoEstado) => {
    try {
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p).filter(p => p.estado !== 'entregado'));
      await api.actualizarPedido(id, { estado: nuevoEstado });
      getSocket().emit('actualizar_pedido', { id, estado: nuevoEstado });
    } catch (err) {
      loadData();
    }
  };

  const handleCerrarMesa = async (mesaId) => {
    try {
      await api.cerrarMesa(mesaId, { metodo_pago: 'efectivo' });
      getSocket().emit('mesa_update', { id: mesaId, estado: 'disponible' });
      loadData();
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleAgregarMesa = async (sector) => {
    try {
      await api.crearMesa({ sector }); 
      loadData();
    } catch (err) {
      alert('Error');
    }
  };

  const handleEliminarMesa = (id) => setDeleteConfirm({ isOpen: true, mesaId: id });

  const confirmEliminarMesa = async () => {
    try {
      await api.eliminarMesa(deleteConfirm.mesaId);
      setDeleteConfirm({ isOpen: false, mesaId: null });
      loadData();
    } catch (err) {
      alert('Error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <form onSubmit={handleLogin} className="glass-card p-8 rounded-3xl w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-center">Admin Access</h1>
          <div className="space-y-4">
            <input type="text" placeholder="Usuario" className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl outline-none" onChange={e => setLoginData({...loginData, usuario: e.target.value})} />
            <input type="password" placeholder="Password" className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl outline-none" onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button className="w-full bg-accent text-dark-900 py-4 rounded-xl font-bold">INGRESAR</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-dark-900 text-white font-[family-name:var(--font-pt-sans-narrow)] uppercase">
      <OrderBoard orders={pedidos} onUpdateStatus={updatePedidoEstado} />

      <main className="flex-1 p-6 space-y-6 overflow-y-auto h-screen custom-scrollbar">
        <Header 
          title={activeTab === 'tablero' ? "PLANO DEL SALON" : "GESTION DE MENU"} 
          subtitle="Diego Bar Control Panel"
          rightElement={
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('tablero')} className={`px-6 py-2.5 rounded-xl text-xs font-bold border ${activeTab === 'tablero' ? 'bg-accent text-dark-900 border-accent' : 'bg-white/5 border-white/5 text-gray-400'}`}>SALON</button>
              <button onClick={() => setActiveTab('menu')} className={`px-6 py-2.5 rounded-xl text-xs font-bold border ${activeTab === 'menu' ? 'bg-accent text-dark-900 border-accent' : 'bg-white/5 border-white/5 text-gray-400'}`}>MENU</button>
              <button onClick={() => setShowHistorial(true)} className="bg-white/5 border border-white/5 px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400">HISTORIAL</button>
            </div>
          }
        />

        {activeTab === 'tablero' ? (
          <MesaPanel mesas={mesas} onMesaClick={id => setSelectedMesaId(id)} onAddMesa={handleAgregarMesa} onDeleteMesa={handleEliminarMesa} />
        ) : (
          <MenuEditor />
        )}
      </main>

      <DetalleMesaModal mesaId={selectedMesaId} isOpen={!!selectedMesaId} onClose={() => setSelectedMesaId(null)} onUpdateMesa={loadData} onCerrarMesa={handleCerrarMesa} />
      <HistorialView isOpen={showHistorial} onClose={() => setShowHistorial(false)} />
      <ConfirmModal isOpen={deleteConfirm.isOpen} title="Eliminar Mesa" message="Seguro?" onConfirm={confirmEliminarMesa} onClose={() => setDeleteConfirm({ isOpen: false, mesaId: null })} />
    </div>
  );
}
