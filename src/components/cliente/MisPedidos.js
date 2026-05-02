'use client';
import { useState } from 'react';
import RouletteGame from './RouletteGame';

export default function MisPedidos({ pedidos, isOpen, onClose, onPedirCuenta }) {
  const [showRuleta, setShowRuleta] = useState(false);
  if (!isOpen) return null;

  const totalPedidos = pedidos.reduce((acc, pedido) => acc + (Number(pedido.total) || 0), 0);

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'recibido':       return 'bg-accent/20 text-accent border-accent/30';
      case 'en_preparacion': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'listo':          return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'entregado':      return 'bg-green-600/20 text-green-400 border-green-500/30';
      default:               return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'recibido':       return '⏳ Recibido';
      case 'en_preparacion': return '👨‍🍳 Preparando';
      case 'listo':          return '✅ Listo';
      case 'entregado':      return '🎉 Entregado';
      default: return estado;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-t-3xl max-h-[92vh] flex flex-col animate-slide-up bg-dark-900 border-t border-white/10">
        <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-white flex items-center gap-2">📝 Mis Pedidos</h2>
          <button onClick={onClose} className="p-2 text-white/60">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pedidos.length === 0 ? (
            <p className="text-center py-12 text-gray-500 italic">No hay pedidos aún</p>
          ) : (
            pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-dark-800/60 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black px-3 py-1 rounded-full border ${getStatusColor(pedido.estado)}">{getStatusText(pedido.estado)}</span>
                </div>
                <div className="space-y-2 border-t border-white/5 pt-3">
                  {pedido.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-white font-bold text-xs">×{item.cantidad} {item.nombre}</span>
                      <span className="text-accent font-black text-xs">${(Number(item.subtotal) || 0).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="text-sm font-black text-white">${(Number(pedido.total) || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))
          )}
          <button onClick={() => setShowRuleta(!showRuleta)} className="w-full py-3 border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 font-black text-[10px] rounded-xl uppercase">🎰 ¿QUIÉN PAGA HOY?</button>
          {showRuleta && <RouletteGame />}
        </div>
        <div className="p-4 bg-dark-800 border-t border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total acumulado</span>
            <span className="text-2xl font-black text-accent">${(totalPedidos || 0).toLocaleString('es-AR')}</span>
          </div>
          <button onClick={onPedirCuenta} className="w-full py-4 bg-yellow-500 text-dark-900 font-black rounded-2xl uppercase text-xs shadow-lg shadow-yellow-500/20">🧾 PEDIR LA CUENTA</button>
        </div>
      </div>
    </div>
  );
}
