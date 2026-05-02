'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Header from '@/components/shared/Header';
import MenuGrid from '@/components/cliente/MenuGrid';
import Cart from '@/components/cliente/Cart';
import OrderConfirm from '@/components/cliente/OrderConfirm';
import MisPedidos from '@/components/cliente/MisPedidos';
import BillModal from '@/components/cliente/BillModal';
import UnifiedOrderDrawer from '@/components/cliente/UnifiedOrderDrawer';
import EmpanadaSelector from '@/components/cliente/EmpanadaSelector';
import CustomizerModal from '@/components/cliente/CustomizerModal';
import CategoryGrid from '@/components/cliente/CategoryGrid';

export default function MesaPage({ params }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMisPedidosOpen, setIsMisPedidosOpen] = useState(false);
  const [mesa, setMesa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [billModal, setBillModal] = useState(null);
  const [empanadaProduct, setEmpanadaProduct] = useState(null);
  const [customizingProduct, setCustomizingProduct] = useState(null);

  // Cache de productos pre-cargados { [catId]: [productos] }
  const productCache = useRef({});
  const prefetching = useRef(new Set());

  // Pre-carga imagenes en el navegador (sin bloquear)
  const preloadImages = (productos) => {
    productos.forEach(p => {
      if (p.imagen_url) {
        const img = new Image();
        img.src = p.imagen_url;
      }
    });
  };

  // Pre-fetch manual al hover/touch (por si el usuario es rapido)
  const handlePrefetch = useCallback(async (catId) => {
    if (productCache.current[catId] || prefetching.current.has(catId)) return;
    prefetching.current.add(catId);
    try {
      const data = await api.getProductos(catId);
      productCache.current[catId] = data;
      preloadImages(data);
    } catch (e) {
      prefetching.current.delete(catId);
    }
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [cats, mesaData] = await Promise.all([
          api.getCategorias(),
          api.getMesa(params.id)
        ]);
        setCategories(cats);
        setMesa(mesaData);

        // PRE-FETCH TOTAL: cargar TODAS las categorias en segundo plano
        // al terminar el render inicial, de a una con 150ms de pausa
        // para no saturar la red ni bloquear la UI.
        const prefetchAll = async () => {
          for (const cat of cats) {
            if (!productCache.current[cat.id] && !prefetching.current.has(cat.id)) {
              prefetching.current.add(cat.id);
              try {
                const data = await api.getProductos(cat.id);
                productCache.current[cat.id] = data;
                preloadImages(data);
              } catch (_) {
                prefetching.current.delete(cat.id);
              }
              await new Promise(r => setTimeout(r, 150));
            }
          }
        };

        if (typeof window !== 'undefined') {
          // requestIdleCallback: espera a que el browser este libre
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => prefetchAll(), { timeout: 3000 });
          } else {
            setTimeout(prefetchAll, 500);
          }
        }

      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();

    const socket = getSocket();
    socket.on('menu_actualizado', loadInitialData);

    return () => {
      socket.off('menu_actualizado', loadInitialData);
    };
  }, [params.id]);

  useEffect(() => {
    if (!activeCategory) return;

    // Si ya esta en cache -> mostrar instantaneamente, sin spinner
    if (productCache.current[activeCategory]) {
      setProducts(productCache.current[activeCategory]);
      setIsLoadingProducts(false);
      window.scrollTo(0, 0);
      return;
    }

    // Si no esta en cache todavia -> skeleton y cargar
    setIsLoadingProducts(true);
    setProducts([]);
    api.getProductos(activeCategory).then(data => {
      productCache.current[activeCategory] = data;
      preloadImages(data);
      setProducts(data);
      setIsLoadingProducts(false);
    }).catch(() => setIsLoadingProducts(false));
    window.scrollTo(0, 0);
  }, [activeCategory]);

  const addToCart = (product) => {
    if (product.nombre.toLowerCase().includes('empanada')) {
      setEmpanadaProduct(product);
      return;
    }
    if (product.nombre.toLowerCase().includes('ensalada')) {
      setCustomizingProduct(product);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && !item.notas);
      if (existing) {
        return prev.map((item) =>
          (item.id === product.id && !item.notas) ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  const addEmpanadaWithNotes = (product, notes, selectedQty) => {
    const isPack = product.nombre.toLowerCase().includes('x');
    const quantityToAdd = isPack ? 1 : selectedQty;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.notas === notes);
      if (existing) {
        return prev.map((item) =>
          (item.id === product.id && item.notas === notes) ? { ...item, cantidad: item.cantidad + quantityToAdd } : item
        );
      }
      return [...prev, { ...product, cantidad: quantityToAdd, notas: notes }];
    });
  };

  const updateQty = (id, qty, notes = null) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => !(item.id === id && item.notas === notes)));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id && item.notas === notes ? { ...item, cantidad: qty } : item))
    );
  };

  const handleCheckout = async () => {
    try {
      const pedidoData = {
        mesa_id: mesa.id,
        items: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          notas: item.notas
        }))
      };
      const nuevoPedido = await api.crearPedido(pedidoData);
      const socket = getSocket();
      socket.emit('nuevo_pedido', { ...nuevoPedido, mesa_numero: mesa.numero });
      setShowConfirm(true);
      setCart([]);
      setIsCartOpen(false);
      const updatedMesa = await api.getMesa(params.id);
      setMesa(updatedMesa);
    } catch (err) {
      alert('Error al enviar pedido: ' + err.message);
    }
  };

  const handlePedirCuenta = async () => {
    try {
      await api.actualizarMesa(mesa.id, { estado: 'por_cobrar' });
      const socket = getSocket();
      socket.emit('mesa_update', { id: mesa.id, estado: 'por_cobrar', numero: mesa.numero });
      setBillModal('success');
      setIsMisPedidosOpen(false);
      setMesa(prev => ({...prev, estado: 'por_cobrar'}));
    } catch (err) {
      alert('Error al pedir la cuenta: ' + err.message);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white font-black uppercase tracking-tighter">Cargando...</div>;

  return (
    <div className="min-h-screen pb-24 font-sans selection:bg-accent selection:text-dark-900">
      <Header
        title="Diego Bar App"
        subtitle={activeCategory
          ? categories.find(c => c.id === activeCategory)?.nombre
          : `Mesa ${mesa?.numero}`}
        rightElement={null}
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
          <MenuGrid products={products} onAdd={addToCart} isLoading={isLoadingProducts} />
        </div>
      ) : (
        <CategoryGrid categories={categories} onSelect={setActiveCategory} onPrefetch={handlePrefetch} />
      )}

      <UnifiedOrderDrawer
        cart={cart}
        mesa={mesa}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPedidos={() => setIsMisPedidosOpen(true)}
        onPedirCuenta={() => setBillModal('confirm')}
        cartTotal={cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0)}
      />

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-40 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 bg-accent hover:bg-accent-dark text-dark-900 font-black rounded-2xl shadow-glow-green flex justify-between px-8 items-center transition-transform active:scale-95 text-xs uppercase tracking-widest"
          >
            <span>Ver mi pedido</span>
            <span>${cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0).toLocaleString('es-AR')}</span>
          </button>
        </div>
      )}

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onUpdateQty={updateQty} onCheckout={handleCheckout} />
      <MisPedidos isOpen={isMisPedidosOpen} onClose={() => setIsMisPedidosOpen(false)} pedidos={mesa?.pedidos || []} onPedirCuenta={() => setBillModal('confirm')} />
      <OrderConfirm isOpen={showConfirm} onClose={() => setShowConfirm(false)} />
      <BillModal type={billModal} isOpen={!!billModal} onClose={() => setBillModal(null)} onConfirm={handlePedirCuenta} />
      <EmpanadaSelector product={empanadaProduct} isOpen={!!empanadaProduct} onClose={() => setEmpanadaProduct(null)} onConfirm={addEmpanadaWithNotes} />
      <CustomizerModal product={customizingProduct} isOpen={!!customizingProduct} onClose={() => setCustomizingProduct(null)} onConfirm={addEmpanadaWithNotes} />
    </div>
  );
}
