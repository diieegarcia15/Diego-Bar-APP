'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Header from '@/components/shared/Header';
import CategoryTabs from '@/components/cliente/CategoryTabs';
import ProductCard from '@/components/cliente/ProductCard';
import MenuGrid from '@/components/cliente/MenuGrid';
import Cart from '@/components/cliente/Cart';
import OrderConfirm from '@/components/cliente/OrderConfirm';
import MisPedidos from '@/components/cliente/MisPedidos';
import BillModal from '@/components/cliente/BillModal';
import UnifiedOrderDrawer from '@/components/cliente/UnifiedOrderDrawer';
import EmpanadaSelector from '@/components/cliente/EmpanadaSelector';
import CustomizerModal from '@/components/cliente/CustomizerModal';

export default function MesaPage({ params }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMisPedidosOpen, setIsMisPedidosOpen] = useState(false);
  const [mesa, setMesa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [billModal, setBillModal] = useState(null); // null, 'confirm', 'success'
  const [empanadaProduct, setEmpanadaProduct] = useState(null);
  const [customizingProduct, setCustomizingProduct] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [cats, mesaData] = await Promise.all([
          api.getCategorias(),
          api.getMesa(params.id)
        ]);
        if (!isMounted) return;
        setCategories(cats);
        setMesa(mesaData);
        if (cats.length > 0) {
          if (!activeCategory || !cats.find(c => c.id === activeCategory)) {
            setActiveCategory(cats[0].id);
            const prods = await api.getProductos(cats[0].id);
            if (isMounted) setProducts(prods);
          } else {
            const prods = await api.getProductos(activeCategory);
            if (isMounted) setProducts(prods);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();

    const socket = getSocket();
    socket.on('menu_actualizado', loadData);

    return () => {
      isMounted = false;
      socket.off('menu_actualizado', loadData);
    };
  }, [params.id, activeCategory]);

  useEffect(() => {
    if (activeCategory) {
      api.getProductos(activeCategory).then(setProducts);
    }
  }, [activeCategory]);

  const addToCart = (product) => {
    // Si el producto es una empanada, abrir el selector
    if (product.nombre.toLowerCase().includes('empanada')) {
      setEmpanadaProduct(product);
      return;
    }

    // Si el producto es una ensalada, abrir el personalizador
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
    // Si el nombre tiene "xN", el precio ya es por el pack, por lo que la cantidad en el carrito es 1.
    // Si no tiene "xN", es por unidad, por lo que la cantidad es el total seleccionado.
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
      
      // Emitir via Socket
      const socket = getSocket();
      socket.emit('nuevo_pedido', {
        ...nuevoPedido,
        mesa_numero: mesa.numero
      });

      setShowConfirm(true);
      setCart([]);
      setIsCartOpen(false);

      // Recargar la mesa para ver los pedidos actualizados
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
      
      // Actualizar estado local
      setMesa(prev => ({...prev, estado: 'por_cobrar'}));
    } catch (err) {
      alert('Error al pedir la cuenta: ' + err.message);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando menú...</div>;

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <Header 
        title="Bar APP Diego" 
        subtitle={`Mesa ${mesa?.numero}`}
        rightElement={null}
      />

      <CategoryTabs 
        categories={categories} 
        activeId={activeCategory} 
        onSelect={setActiveCategory} 
      />

      <MenuGrid products={products} onAdd={addToCart} />

      {/* Panel Flotante Unificado (Pestaña Oculta a la derecha para Cuenta e Historial) */}
      <UnifiedOrderDrawer 
        cart={cart}
        mesa={mesa}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPedidos={() => setIsMisPedidosOpen(true)}
        onPedirCuenta={() => setBillModal('confirm')}
        cartTotal={cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0)}
      />

      {/* Botón Flotante Carrito (Visible cuando hay productos) */}
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

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart} 
        onUpdateQty={updateQty} 
        onCheckout={handleCheckout} 
      />

      <MisPedidos
        isOpen={isMisPedidosOpen}
        onClose={() => setIsMisPedidosOpen(false)}
        pedidos={mesa?.pedidos || []}
        onPedirCuenta={() => setBillModal('confirm')}
      />

      <OrderConfirm 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
      />

      <BillModal
        type={billModal}
        isOpen={!!billModal}
        onClose={() => setBillModal(null)}
        onConfirm={handlePedirCuenta}
      />

      <EmpanadaSelector
        product={empanadaProduct}
        isOpen={!!empanadaProduct}
        onClose={() => setEmpanadaProduct(null)}
        onConfirm={addEmpanadaWithNotes}
      />

      <CustomizerModal
        product={customizingProduct}
        isOpen={!!customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onConfirm={addEmpanadaWithNotes} // Reutilizamos la función que maneja notas y cantidad
      />
    </div>
  );
}
