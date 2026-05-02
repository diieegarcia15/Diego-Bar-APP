'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Header from '@/components/shared/Header';
import MenuGrid from '@/components/cliente/MenuGrid';
import BillModal from '@/components/cliente/BillModal';
import UnifiedOrderDrawer from '@/components/cliente/UnifiedOrderDrawer';
import CategoryGrid from '@/components/cliente/CategoryGrid';

export default function MesaPage({ params }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [mesa, setMesa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billModal, setBillModal] = useState(null); 

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cats, mesaData] = await Promise.all([
          api.getCategorias(),
          api.getMesa(params.id)
        ]);
        setCategories(cats);
        setMesa(mesaData);
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();

    const socket = getSocket();
    socket.on('menu_actualizado', loadInitialData);
    socket.on('mesa_actualizada', (data) => {
      if (data.id == params.id) loadInitialData();
    });

    return () => {
      socket.off('menu_actualizado');
      socket.off('mesa_actualizada');
    };
  }, [params.id]);

  useEffect(() => {
    if (!activeCategory) return;
    setIsLoadingProducts(true);
    setProducts([]);
    api.getProductos(activeCategory).then(data => {
      setProducts(data);
      setIsLoadingProducts(false);
    }).catch(() => setIsLoadingProducts(false));
    window.scrollTo(0, 0);
  }, [activeCategory]);

  const handlePedirCuenta = async () => {
    try {
      await api.actualizarMesa(mesa.id, { estado: 'por_cobrar' });
      const socket = getSocket();
      socket.emit('mesa_update', { id: mesa.id, estado: 'por_cobrar', numero: mesa.numero });
      setBillModal('success');
    } catch (err) {
      alert('Error al pedir la cuenta: ' + err.message);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-dark-900" />;

  return (
    <div className="min-h-screen pb-24 bg-dark-900 text-white selection:bg-accent selection:text-dark-900">
      <Header 
        title="Diego Bar App" 
        subtitle={activeCategory 
          ? categories.find(c => String(c.id) === String(activeCategory))?.nombre 
          : mesa ? `Mesa ${mesa.numero}` : 'Cargando...'}
      />

      {activeCategory ? (
        <div className="animate-fade-in">
          <div className="px-4 py-4 flex justify-between items-center">
            <button 
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-xl border border-accent/20 hover:bg-accent/20 transition-all"
            >
              ← VOLVER AL MENÚ
            </button>
          </div>
          <MenuGrid products={products} onAdd={() => {}} isLoading={isLoadingProducts} />
        </div>
      ) : (
        <CategoryGrid categories={categories} onSelect={setActiveCategory} />
      )}

      <UnifiedOrderDrawer 
        mesa={mesa}
        onOpenPedidos={() => {}} 
        onPedirCuenta={() => setBillModal('confirm')}
      />

      <BillModal 
        type={billModal} 
        isOpen={!!billModal} 
        onClose={() => setBillModal(null)} 
        onConfirm={handlePedirCuenta} 
      />
    </div>
  );
}
