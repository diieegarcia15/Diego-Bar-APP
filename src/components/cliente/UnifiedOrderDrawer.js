'use client';
import { useState } from 'react';
import IconRenderer from '../shared/IconRenderer';

export default function UnifiedOrderDrawer({ 
  cart, 
  mesa, 
  onOpenCart, 
  onOpenPedidos, 
  onPedirCuenta,
  cartTotal 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fixed bottom-10 right-0 z-[60] transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'}`}>
      <div className="flex items-end">
        {/* Pestaña / Flechita */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-20 bg-accent text-dark-900 rounded-l-2xl shadow-2xl flex items-center justify-center group border-y border-l border-white/20 mb-6"
        >
          <span className={`text-xl transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            ◀
          </span>
        </button>

        {/* Panel Contenido */}
        <div className="bg-dark-800/95 backdrop-blur-2xl border-l border-white/10 w-72 h-auto p-6 rounded-tl-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent opacity-70">Tu Mesa</h3>
            <p className="text-2xl font-bold">Mesa {mesa?.numero}</p>
          </div>

          <div className="space-y-4">
            {/* Sección Mis Pedidos */}
            {mesa?.pedidos && mesa.pedidos.length > 0 && (
              <button 
                onClick={() => {
                  onOpenPedidos();
                  setIsOpen(false);
                }}
                className="w-full glass-card p-4 rounded-2xl flex items-center justify-between group hover:border-accent/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                    📝
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-50">Historial</span>
                    <span className="font-bold text-sm">Ver pedidos</span>
                  </div>
                </div>
                <span className="text-xs">▶</span>
              </button>
            )}

            {/* Botón Pedir Cuenta */}
            {mesa?.pedidos && mesa.pedidos.length > 0 && (
              <button 
                onClick={() => {
                  onPedirCuenta();
                  setIsOpen(false);
                }}
                className="w-full py-4 bg-white text-dark-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform text-xs uppercase tracking-widest"
              >
                <span>💵 Pedir la Cuenta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
