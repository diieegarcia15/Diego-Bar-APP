'use client';
import { useState } from 'react';
import { ShoppingBag, Receipt, ChevronUp, ChevronDown } from 'lucide-react';

export default function UnifiedOrderDrawer({ cart, mesa, onOpenCart, onOpenPedidos, onPedirCuenta, cartTotal }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeOrdersCount = mesa?.pedidos?.filter(p => p.estado !== 'entregado').length || 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
      {/* Botón Flotante Central */}
      <div className="pointer-events-auto bg-dark-800 border-t border-x border-white/10 rounded-t-3xl shadow-2xl px-6 py-4 flex gap-4 items-center">
        {/* Pedidos Activos */}
        <button 
          onClick={onOpenPedidos}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white relative"
        >
          <Receipt size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Mis Pedidos</span>
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-dark-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {activeOrdersCount}
            </span>
          )}
        </button>

        {/* Carrito / Ticket */}
        <button 
          onClick={onOpenCart}
          className="flex items-center gap-3 px-6 py-2 rounded-xl bg-accent text-dark-900 hover:scale-105 transition-all shadow-glow-green"
        >
          <ShoppingBag size={18} />
          <div className="flex flex-col items-start">
            <span className="text-[8px] font-black uppercase tracking-tighter leading-none opacity-70">Total Carrito</span>
            <span className="text-sm font-black leading-none">${cartTotal.toLocaleString('es-AR')}</span>
          </div>
        </button>

        {/* Pedir Cuenta */}
        <button 
          onClick={onPedirCuenta}
          className="px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Pedir Cuenta</span>
        </button>
      </div>
    </div>
  );
}
