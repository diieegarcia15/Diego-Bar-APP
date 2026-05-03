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

  useEffect(() => {
    if (!isMounted) return;
    async function loadData() {
      if (!params?.id) {
        setError("No se especific una mesa vlida.");
        setIsLoading(false);
        return;
      }

      try {
        const [cats, mesaData] = await Promise.all([
          api.getCategorias(), 
          api.getMesa(params.id)
        ]);
        
        setCategories(Array.isArray(cats) ? cats : []);
        setMesa(mesaData);
        setError(null);
      } catch (err) { 
        console.error("Error al cargar datos:", err); 
        setError("Error de conexin con el servidor. Verific que el bar est en lnea.");
      } finally { 
        setIsLoading(false); 
      }
    }

    loadData();

    // Configuracin de Socket.IO
    try {
      const socket = getSocket();
      socket.on('menu_actualizado', loadData);
      socket.on('mesa_actualizada', (data) => { 
        if (data.id == params?.id) loadData(); 
      });
      socket.on('pedido_actualizado', loadData);

      return () => { 
        socket.off('menu_actualizado'); 
        socket.off('mesa_actualizada'); 
        socket.off('pedido_actualizado'); 
      };
    } catch (err) {
      console.warn("Error al inicializar sockets:", err);
    }
  }, [params?.id, isMounted]);

  useEffect(() => {
    if (!activeCategory) return;
    setIsLoadingProducts(true);
    api.getProductos(activeCategory)
      .then(data => { 
        setProducts(Array.isArray(data) ? data : []); 
        setIsLoadingProducts(false); 
      })
      .catch(() => setIsLoadingProducts(false));
    window.scrollTo(0, 0);
  }, [activeCategory]);

  const handleAddToCart = (product, notas = null, cantidad = 1) => {
    if (!mesa) {
      alert("Error: No se pudo identificar la mesa. Recarg la pgina.");
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
      cartId: Date.now() + Math.random() // ID nico para el carrito local
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
      getSocket().emit('nuevo_pedido', { ...nuevoPedido, mesa_numero: mesa.numero });
      
      setCart([]); // Limpiar carrito local
      setShowConfirm(true);
      
      // Recargar datos de mesa para ver el nuevo pedido en el historial
      const updatedMesa = await api.getMesa(params.id);
      setMesa(updatedMesa);
    } catch (err) {
      alert('Error al enviar pedido: ' + err.message);
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
        <p className="text-accent font-black tracking-widest text-xs uppercase animate-pulse">Cargando Men...</p>
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
              className="my-4 text-accent text-[10px] font-black uppercase flex items-center gap-2 hover:translate-x-[-4px] transition-transform"
            >
              \u2190 VOLVER AL MEN\u00da
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
