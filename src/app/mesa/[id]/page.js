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
    async function loadData() {
      try {
        const [cats, mesaData] = await Promise.all([api.getCategorias(), api.getMesa(params.id)]);
        setCategories(cats);
        setMesa(mesaData);
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    }
    loadData();
    const socket = getSocket();
    socket.on('menu_actualizado', loadData);
    socket.on('mesa_actualizada', (data) => { if (data.id == params.id) loadData(); });
    return () => { socket.off('menu_actualizado'); socket.off('mesa_actualizada'); };
  }, [params.id]);

  useEffect(() => {
    if (!activeCategory) return;
    setIsLoadingProducts(true);
    api.getProductos(activeCategory).then(data => {
      setProducts(data);
      setIsLoadingProducts(false);
    }).catch(() => setIsLoadingProducts(false));
    window.scrollTo(0, 0);
  }, [activeCategory]);

  const handlePedirCuenta = async () => {
    try {
      await api.actualizarMesa(mesa.id, { estado: 'por_cobrar' });
      getSocket().emit('mesa_update', { id: mesa.id, estado: 'por_cobrar', numero: mesa.numero });
      setBillModal('success');
    } catch (err) { alert(err.message); }
  };

  if (isLoading) return <div className="min-h-screen bg-dark-900" />;

  return (
    <div className="min-h-screen pb-24 bg-dark-900 text-white">
      <Header title="Diego Bar" subtitle={activeCategory ? categories.find(c => c.id === activeCategory)?.nombre : `Mesa ${mesa?.numero}`} />
      {activeCategory ? (
        <div className="animate-fade-in px-4">
          <button onClick={() => setActiveCategory(null)} className="my-4 text-accent text-[10px] font-black uppercase">← VOLVER</button>
          <MenuGrid products={products} onAdd={() => {}} isLoading={isLoadingProducts} />
        </div>
      ) : (
        <CategoryGrid categories={categories} onSelect={setActiveCategory} />
      )}
      <UnifiedOrderDrawer mesa={mesa} onPedirCuenta={() => setBillModal('confirm')} />
      <BillModal type={billModal} isOpen={!!billModal} onClose={() => setBillModal(null)} onConfirm={handlePedirCuenta} />
    </div>
  );
}
