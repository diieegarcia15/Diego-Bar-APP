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
  const [productsCache, setProductsCache] = useState({}); // Memoria temporal para velocidad
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
    if (!mesaId) {
      setError("Mesa no v\u00e1lida.");
      setIsLoading(false);
      return;
    }

    try {
      const [cats, mesaData] = await Promise.all([
        api.getCategorias(), 
        api.getMesa(mesaId)
      ]);
      
      setCategories(Array.isArray(cats) ? cats : []);
      setMesa(mesaData || null);
      setError(null);
    } catch (err) { 
      console.error("Error al cargar datos:", err); 
      setError("Error de conexi\u00f3n con el servidor. Verific\u00e1 que el bar est\u00e1 en l\u00ednea.");
    } finally { 
      setIsLoading(false); 
    }
  }, [params?.id]);

  useEffect(() => {
    if (!isMounted) return;
    loadData();

    // Configuraci\u00f3n de Socket.IO
    try {
      const socket = getSocket();
      if (socket && typeof socket.on === 'function') {
        socket.on('menu_actualizado', () => {
          setProductsCache({}); // Limpiar cach\u00e9 si cambia el men\u00fa
          loadData();
        });
        socket.on('mesa_actualizada', (data) => { 
          if (data?.id == params?.id) loadData(); 
        });
        socket.on('pedido_actualizado', loadData);

        return () => { 
          socket.off('menu_actualizado'); 
          socket.off('mesa_actualizada'); 
          socket.off('pedido_actualizado'); 
        };
      }
    } catch (err) {
      console.warn("Error al inicializar sockets:", err);
    }
  }, [isMounted, loadData, params?.id]);

  useEffect(() => {
    if (!activeCategory) return;
    
    // Si ya tenemos los productos en memoria, no le preguntamos al servidor
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
    if (!mesa) {
      alert("Error: No se pudo identificar la mesa. Recarg\u00e1 la p\u00e1gina.");
      return;
    }

    // Si es empanada o ensalada y no tiene notas, abrir modal
    if (!notas) {
      if (product.nombre.toLowerCase().includes('empanada')) {
        setEmpanadaProduct(product);
        return;
      }
      if (product.nombre.toLowerCase().includes('ensalada')) {
        setCustomizingProduct(product);
        return;
      }
    }

    const newItem = {
      ...product,
      notas,
      cantidad,
      cartId: Date.now() + Math.random() // ID \u00fanico para el carrito local
    };

    setCart(prev => [...prev, newItem]);
  };

  const handleUpdateCartQty = (cartId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, cantidad: Math.max(1, item.cantidad + delta) };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleConfirmOrder = async () => {
    if (!mesa || cart.length === 0) return;

    // COPIA LOCAL DEL CARRITO para el proceso en segundo plano
    const itemsToOrder = [...cart];
    const mesaId = mesa.id;
    const mesaNumero = mesa.numero;

    // 1. REACCI\u00d3N INSTANT\u00c1NEA: Limpiamos carrito y mostramos confirmaci\u00f3n de una vez
    setCart([]); 
    setShowConfirm(true);

    // 2. TRABAJO EN SEGUNDO PLANO
    try {
      const pedidoData = {
        mesa_id: mesaId,
        items: itemsToOrder.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          notas: item.notas
        }))
      };
      
      const nuevoPedido = await api.crearPedido(pedidoData);
      getSocket().emit('nuevo_pedido', { ...nuevoPedido, mesa_numero: mesaNumero });
      
      // Recargar datos de mesa para ver el nuevo pedido en el historial (silenciosamente)
      api.getMesa(params.id).then(updatedMesa => setMesa(updatedMesa));
    } catch (err) {
      // Si falla, avisamos al usuario y devolvemos los items al carrito
      console.error("Error enviando pedido:", err);
      alert('\u26a0\ufe0f Hubo un problema de conexi\u00f3n. Por favor, intent\u00e1 enviar tu pedido nuevamente.');
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
    } catch (err) { alert(err.message); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-accent font-black tracking-widest text-xs uppercase animate-pulse">Cargando Men\u00fa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card p-8 rounded-3xl space-y-6 max-w-sm border-red-500/30">
          <div className="text-5xl">\u26a0\ufe0f</div>
          <h2 className="text-xl font-black text-white uppercase">Hubo un problema</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-white text-dark-900 font-black rounded-2xl uppercase tracking-widest text-xs"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!isMounted) return null;

  return (
    <div className="min-h-screen pb-24 text-white">
      <Header 
        title="Diego Bar" 
        subtitle={activeCategory 
          ? categories.find(c => String(c.id) === String(activeCategory))?.nombre 
          : mesa ? `Mesa ${mesa.numero}` : '...'} 
      />

      <main className="max-w-4xl mx-auto">
        {activeCategory ? (
          <div className="animate-fade-in px-4">
            <button 
              onClick={() => setActiveCategory(null)} 
              className="my-6 text-accent text-xs font-black uppercase flex items-center gap-3 hover:translate-x-[-4px] transition-transform group"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-dark-900 transition-colors">
                <IconRenderer name="ChevronLeft" size="1.25rem" noBackground />
              </div>
              VOLVER AL MEN\u00da
            </button>
            <MenuGrid products={products} onAdd={handleAddToCart} isLoading={isLoadingProducts} />
          </div>
        ) : (
          <CategoryGrid categories={categories} onSelect={setActiveCategory} />
        )}
      </main>

      {mesa && (
        <>
          <UnifiedOrderDrawer 
            mesa={mesa} 
            cart={cart}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onConfirmOrder={handleConfirmOrder}
            onOpenPedidos={() => setIsMisPedidosOpen(true)}
            onPedirCuenta={() => setBillModal('confirm')} 
          />

          <MisPedidos 
            isOpen={isMisPedidosOpen} 
            onClose={() => setIsMisPedidosOpen(false)} 
            pedidos={mesa?.pedidos || []} 
            onPedirCuenta={() => { setIsMisPedidosOpen(false); setBillModal('confirm'); }} 
          />
        </>
      )}

      <BillModal 
        type={billModal} 
        isOpen={!!billModal} 
        onClose={() => setBillModal(null)} 
        onConfirm={handlePedirCuenta} 
      />
      
      <OrderConfirm 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
      />
      
      <EmpanadaSelector 
        product={empanadaProduct} 
        isOpen={!!empanadaProduct} 
        onClose={() => setEmpanadaProduct(null)} 
        onConfirm={(p, notes, qty) => { setEmpanadaProduct(null); handleAddToCart(p, notes, qty); }} 
      />
      
      <CustomizerModal 
        product={customizingProduct} 
        isOpen={!!customizingProduct} 
        onClose={() => setCustomizingProduct(null)} 
        onConfirm={(p, notes) => { setCustomizingProduct(null); handleAddToCart(p, notes, 1); }} 
      />
    </div>
  );
}
