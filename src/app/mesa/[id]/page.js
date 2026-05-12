'use client';
import { useState, useEffect, useCallback } from 'react';
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
import IconRenderer from '@/components/shared/IconRenderer';

export default function MesaPage({ params }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsCache, setProductsCache] = useState({}); 
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [mesa, setMesa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billModal, setBillModal] = useState(null); 
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMisPedidosOpen, setIsMisPedidosOpen] = useState(false);
  const [empanadaProduct, setEmpanadaProduct] = useState(null);
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadData = useCallback(async () => {
    const mesaId = params?.id;

    // Validar que el ID sea un entero positivo antes de hacer cualquier request
    const mesaIdInt = parseInt(mesaId, 10);
    if (!mesaId || !Number.isInteger(mesaIdInt) || mesaIdInt <= 0) {
      setError('ID de mesa inválido.');
      setIsLoading(false);
      return;
    }

    try {
      const [cats, mesaData] = await Promise.all([
        api.getCategorias(),
        api.getMesa(mesaIdInt)
      ]);

      setCategories(Array.isArray(cats) ? cats : []);
      setMesa(mesaData || null);
      setError(null);
    } catch (err) {
      setError('Error de conexion.');
    } finally {
      setIsLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    if (!isMounted) return;
    loadData();
    try {
      const socket = getSocket();
      socket.on('menu_actualizado', () => {
        setProductsCache({});
        loadData();
      });
      socket.on('mesa_actualizada', (data) => { if (data?.id == params?.id) loadData(); });
      socket.on('pedido_actualizado', loadData);
      return () => { 
        socket.off('menu_actualizado'); 
        socket.off('mesa_actualizada'); 
        socket.off('pedido_actualizado'); 
      };
    } catch (err) {}
  }, [isMounted, loadData, params?.id]);

  useEffect(() => {
    if (!activeCategory) return;
    if (productsCache[activeCategory]) {
      setProducts(productsCache[activeCategory]);
      window.scrollTo(0, 0);
      return;
    }
    setIsLoadingProducts(true);
    api.getProductos(activeCategory)
      .then(data => { 
        const productsList = Array.isArray(data) ? data : [];
        setProducts(productsList); 
        setProductsCache(prev => ({ ...prev, [activeCategory]: productsList }));
        setIsLoadingProducts(false); 
      })
      .catch(() => setIsLoadingProducts(false));
    window.scrollTo(0, 0);
  }, [activeCategory, productsCache]);

  const handleAddToCart = (product, notas = null, cantidad = 1) => {
    if (!mesa) return;
    if (!notas) {
      if (product.nombre.toLowerCase().includes('empanada')) { setEmpanadaProduct(product); return; }
      if (product.nombre.toLowerCase().includes('ensalada')) { setCustomizingProduct(product); return; }
    }
    const newItem = { ...product, notas, cantidad, cartId: Date.now() + Math.random() };
    setCart(prev => [...prev, newItem]);
  };

  const handleUpdateCartQty = (cartId, delta) => {
    setCart(prev => prev.map(item => (item.cartId === cartId ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item)));
  };

  const handleRemoveFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleConfirmOrder = async () => {
    if (!mesa || cart.length === 0) return;
    const itemsToOrder = [...cart];
    setCart([]);
    setShowConfirm(true);
    try {
      const pedidoData = {
        mesa_id: mesa.id,
        items: itemsToOrder.map(item => ({ producto_id: item.id, cantidad: item.cantidad, notas: item.notas }))
      };
      // El servidor emite 'pedido_recibido' via WebSocket al confirmar el REST.
      // No necesitamos emitir manualmente desde el cliente (evita notificaciones duplicadas).
      await api.crearPedido(pedidoData);
      api.getMesa(params.id).then(updatedMesa => setMesa(updatedMesa));
    } catch (err) {
      alert('Error al enviar pedido');
      setCart(itemsToOrder);
      setShowConfirm(false);
    }
  };

  const handlePedirCuenta = async () => {
    if (!mesa) return;
    try {
      await api.actualizarMesa(mesa.id, { estado: 'por_cobrar' });
      getSocket().emit('mesa_update', { id: mesa.id, estado: 'por_cobrar', numero: mesa.numero });
      setBillModal('success');
    } catch (err) { alert('Error'); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-accent font-black tracking-widest text-xs uppercase animate-pulse">Cargando Menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card p-8 rounded-3xl space-y-6 max-w-sm border-red-500/30">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-black text-white uppercase">Hubo un problema</h2>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-dark-900 font-black rounded-2xl uppercase tracking-widest text-xs">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!isMounted) return null;

  return (
    <div className="min-h-screen pb-24 text-white font-[family-name:var(--font-pt-sans-narrow)] uppercase">
      <Header title="Diego Bar" subtitle={activeCategory ? categories.find(c => String(c.id) === String(activeCategory))?.nombre : mesa ? `Mesa ${mesa.numero}` : '...'} />
      <main className="max-w-4xl mx-auto">
        {activeCategory ? (
          <div className="animate-fade-in px-4">
            <button onClick={() => setActiveCategory(null)} className="my-6 text-accent text-xs font-black uppercase flex items-center gap-3 hover:translate-x-[-4px] transition-transform group">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-dark-900 transition-colors">
                <IconRenderer name="ChevronLeft" size="1.25rem" noBackground />
              </div>
              VOLVER AL MENU
            </button>
            <MenuGrid products={products} onAdd={handleAddToCart} isLoading={isLoadingProducts} />
          </div>
        ) : (
          <CategoryGrid categories={categories} onSelect={setActiveCategory} />
        )}
      </main>
      {mesa && (
        <>
          <UnifiedOrderDrawer mesa={mesa} cart={cart} onUpdateQty={handleUpdateCartQty} onRemoveItem={handleRemoveFromCart} onConfirmOrder={handleConfirmOrder} onOpenPedidos={() => setIsMisPedidosOpen(true)} onPedirCuenta={() => setBillModal('confirm')} />
          <MisPedidos isOpen={isMisPedidosOpen} onClose={() => setIsMisPedidosOpen(false)} pedidos={mesa?.pedidos || []} onPedirCuenta={() => { setIsMisPedidosOpen(false); setBillModal('confirm'); }} />
        </>
      )}
      <BillModal type={billModal} isOpen={!!billModal} onClose={() => setBillModal(null)} onConfirm={handlePedirCuenta} />
      <OrderConfirm isOpen={showConfirm} onClose={() => setShowConfirm(false)} />
      <EmpanadaSelector product={empanadaProduct} isOpen={!!empanadaProduct} onClose={() => setEmpanadaProduct(null)} onConfirm={(p, notes, qty) => { setEmpanadaProduct(null); handleAddToCart(p, notes, qty); }} />
      <CustomizerModal product={customizingProduct} isOpen={!!customizingProduct} onClose={() => setCustomizingProduct(null)} onConfirm={(p, notes) => { setCustomizingProduct(null); handleAddToCart(p, notes, 1); }} />
    </div>
  );
}
