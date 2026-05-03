'use client';
import { useState, useEffect, useCallback } from 'react';
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

  const notificationSound = typeof window !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3') : null;

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
        setMesas(prev => prev.map(m => m.id === nuevoPedido.mesa_id ? { ...m, estado: 'ocupada' } : m));
        notificationSound?.play().catch(() => {});
      });

      socket.on('pedido_actualizado', (updatedData) => {
        if (updatedData?.id) {
          setPedidos(prev => prev.map(p => p.id === updatedData.id ? { ...p, ...updatedData } : p).filter(p => p.estado !== 'entregado'));
        } else {
          loadData();
        }
      });

      socket.on('mesa_actualizada', (data) => {
        if (data?.id) {
          setMesas(prev => prev.map(m => m.id === data.id ? { ...m, ...data } : m));
          if (data.estado === 'por_cobrar') {
            notificationSound?.play().catch(() => {});
          }
        } else {
          loadData();
        }
      });

      return () => {
        socket.off('pedido_recibido');
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
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('fetch')) {
        alert('\u26a0\ufe0f El servidor est\u00e1 iniciando (puede tardar 30-60 segundos en el plan gratuito). Esper\u00e1 un momento y volv\u00e9 a intentarlo.');
      } else {
        alert('\u274c Credenciales inv\u00e1lidas. Usuario o contrase\u00f1a incorrectos.');
      }
    }
  };

  const updatePedidoEstado = async (id, nuevoEstado) => {
    try {
      // Update local state immediately for responsiveness
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p).filter(p => p.estado !== 'entregado'));
      
      await api.actualizarPedido(id, { estado: nuevoEstado });
      getSocket().emit('actualizar_pedido', { id, estado: nuevoEstado });
    } catch (err) {
      alert(err.message);
      loadData(); // Revert on error
    }
  };

  const handleCerrarMesa = async (mesaId) => {
    try {
      await api.cerrarMesa(mesaId, { metodo_pago: 'efectivo' });
      getSocket().emit('mesa_update', { id: mesaId, estado: 'disponible' });
      loadData();
      return true;
    } catch (err) {
      alert('Error al cerrar mesa: ' + err.message);
      return false;
    }
  };

  const handleAgregarMesa = async (sector) => {
    try {
      await api.crearMesa({ sector }); 
      loadData();
    } catch (err) {
      alert('Error al agregar mesa: ' + err.message);
    }
  };

  const handleEliminarMesa = async (id) => {
    setDeleteConfirm({ isOpen: true, mesaId: id });
  };

  const confirmEliminarMesa = async () => {
    try {
      await api.eliminarMesa(deleteConfirm.mesaId);
      loadData();
    } catch (err) {
      alert('Error al eliminar mesa: ' + err.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <form onSubmit={handleLogin} className="glass-card p-8 rounded-3xl w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-center">\ud83d\udcbb Computadora Maestra</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Usuario"
              className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl focus:border-accent outline-none"
              onChange={e => setLoginData({...loginData, usuario: e.target.value})}
            />
            <input
              type="password"
              placeholder="Contrase\u00f1a"
              className="w-full bg-dark-800 border border-white/10 p-4 rounded-xl focus:border-accent outline-none"
              onChange={e => setLoginData({...loginData, password: e.target.value})}
            />
            <button className="w-full bg-accent text-dark-900 py-4 rounded-xl font-bold hover:shadow-glow-green transition-all">
              INGRESAR AL SISTEMA
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar: Ahora con el Tablero de Pedidos */}
      <OrderBoard 
        orders={pedidos} 
        onUpdateStatus={updatePedidoEstado} 
      />

      {/* \u00c1rea Principal: Plano de Mesas o Editor de Men\u00fa */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto h-screen custom-scrollbar">
        <Header 
          title={activeTab === 'tablero' ? "PLANO DEL SAL\u00d3N" : "EDITOR DE MEN\u00da"} 
          subtitle={activeTab === 'tablero' ? "Visualizaci\u00f3n y control de mesas en tiempo real" : "Administrar productos y categor\u00edas"}
          rightElement={
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('tablero')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'tablero' ? 'bg-accent text-dark-900' : 'glass-card hover:bg-white/10 text-white'}`}
              >
                \ud83c\udfe0 MESA CENTRAL
              </button>
              <button 
                onClick={() => setActiveTab('menu')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'menu' ? 'bg-accent text-dark-900' : 'glass-card hover:bg-white/10 text-white'}`}
              >
                \ud83c\udf54 EDITAR MEN\u00da
              </button>
              <button 
                onClick={() => setShowHistorial(true)}
                className="glass-card hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-white"
              >
                \ud83d\udcdc HISTORIAL
              </button>
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

      <DetalleMesaModal 
        mesaId={selectedMesaId} 
        isOpen={!!selectedMesaId} 
        onClose={() => setSelectedMesaId(null)}
        onUpdateMesa={loadData}
        onCerrarMesa={handleCerrarMesa}
      />

      <HistorialView 
        isOpen={showHistorial} 
        onClose={() => setShowHistorial(false)} 
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="\u00bfEliminar Mesa?"
        message="Esta acci\u00f3n no se puede deshacer."
        onConfirm={confirmEliminarMesa}
        onClose={() => setDeleteConfirm({ isOpen: false, mesaId: null })}
      />
    </div>
  );
}
