'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Header from '@/components/shared/Header';
import MenuGrid from '@/components/cliente/MenuGrid';
import MisPedidos from '@/components/cliente/MisPedidos';
import BillModal from '@/components/cliente/BillModal';
import UnifiedOrderDrawer from '@/components/cliente/UnifiedOrderDrawer';
import CategoryGrid from '@/components/cliente/CategoryGrid';
import OrderConfirm from '@/components/cliente/OrderConfirm';
import EmpanadaSelector from '@/components/cliente/EmpanadaSelector';
import CustomizerModal from '@/components/cliente/CustomizerModal';

export default function MesaPage({ params }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [mesa, setMesa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billModal, setBillModal] = useState(null); 
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMisPedidosOpen, setIsMisPedidosOpen] = useState(false);
  const [empanadaProduct, setEmpanadaProduct] = useState(null);
  const [customizingProduct, setCustomizingProduct] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, mesaData] = await Promise.all([api.getCategorias(), api.getMesa(params.id)]);
        setCategories(cats); setMesa(mesaData);
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    }
    loadData();
    const socket = getSocket();
    socket.on('menu_actualizado', loadData);
    socket.on('mesa_actualizada', (data) => { if (data.id == params.id) loadData(); });
    socket.on('pedido_actualizado', loadData);
    return () => { socket.off('menu_actualizado'); socket.off('mesa_actualizada'); socket.off('pedido_actualizado'); };
  }, [params.id]);

  useEffect(() => {
    if (!activeCategory) return;
    setIsLoadingProducts(true);
    api.getProductos(activeCategory).then(data => { setProducts(data); setIsLoadingProducts(false); })
       .catch(() => setIsLoadingProducts(false));
    window.scrollTo(0, 0);
  }, [activeCategory]);

  const handleInstantOrder = async (product, notas = null, cantidad = 1) => {
    if (!notas) {
      if (product.nombre.toLowerCase().includes('empanada')) { setEmpanadaProduct(product); return; }
      if (product.nombre.toLowerCase().includes('ensalada')) { setCustomizingProduct(product); return; }
    }
    try {
      const pedidoData = { mesa_id: mesa.id, items: [{ producto_id: product.id, cantidad, notas }] };
      const nuevoPedido = await api.crearPedido(pedidoData);
      getSocket().emit('nuevo_pedido', { ...nuevoPedido, mesa_numero: mesa.numero });
      setShowConfirm(true);
      const updatedMesa = await api.getMesa(params.id); setMesa(updatedMesa);
    } catch (err) { alert(err.message); }
  };

  if (isLoading) return <div className="min-h-screen bg-dark-900" />;

  return (
    <div className="min-h-screen pb-24 bg-dark-900 text-white">
      <Header title="Diego Bar" subtitle={activeCategory ? categories.find(c => String(c.id) === String(activeCategory))?.nombre : mesa ? `Mesa ${mesa.numero}` : '...'} />
      {activeCategory ? (
        <div className="px-4">
          <button onClick={() => setActiveCategory(null)} className="my-4 text-accent text-[10px] font-black">← VOLVER</button>
          <MenuGrid products={products} onAdd={handleInstantOrder} isLoading={isLoadingProducts} />
        </div>
      ) : (
        <CategoryGrid categories={categories} onSelect={setActiveCategory} />
      )}
      <UnifiedOrderDrawer mesa={mesa} onOpenPedidos={() => setIsMisPedidosOpen(true)} onPedirCuenta={() => setBillModal('confirm')} />
      <MisPedidos isOpen={isMisPedidosOpen} onClose={() => setIsMisPedidosOpen(false)} pedidos={mesa?.pedidos || []} onPedirCuenta={() => { setIsMisPedidosOpen(false); setBillModal('confirm'); }} />
      <BillModal type={billModal} isOpen={!!billModal} onClose={() => setBillModal(null)} onConfirm={() => api.actualizarMesa(mesa.id, { estado: 'por_cobrar' }).then(() => setBillModal('success'))} />
      <OrderConfirm isOpen={showConfirm} onClose={() => setShowConfirm(false)} />
      <EmpanadaSelector product={empanadaProduct} isOpen={!!empanadaProduct} onClose={() => setEmpanadaProduct(null)} onConfirm={(p, n, q) => { setEmpanadaProduct(null); handleInstantOrder(p, n, q); }} />
      <CustomizerModal product={customizingProduct} isOpen={!!customizingProduct} onClose={() => setCustomizingProduct(null)} onConfirm={(p, n) => { setCustomizingProduct(null); handleInstantOrder(p, n, 1); }} />
    </div>
  );
}
