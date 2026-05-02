'use client';
import { useState } from 'react';
import RouletteGame from './RouletteGame';

export default function MisPedidos({ pedidos, isOpen, onClose, onPedirCuenta }) {
  const [showRuleta, setShowRuleta] = useState(false);

  if (!isOpen) return null;

  const totalPedidos = pedidos.reduce((acc, pedido) => acc + Number(pedido.total), 0);

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
      <div className="relative glass-card rounded-t-3xl max-h-[92vh] flex flex-col animate-slide-up">

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            📝 Mis Pedidos
            {pedidos.length > 0 && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold border border-accent/30">
                {pedidos.length}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="p-2 bg-dark-700 rounded-full w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors">✕</button>
        </div>

        {/* Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pedidos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">
              <p className="text-4xl mb-3">🍽️</p>
              <p>Aún no realizaste ningún pedido</p>
            </div>
          ) : (
            pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-dark-800/60 p-4 rounded-2xl border border-white/8 space-y-3">
                {/* Encabezado del pedido */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold">
                    {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${getStatusColor(pedido.estado)}`}>
                    {getStatusText(pedido.estado)}
                  </span>
                </div>

                {/* Items del pedido */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  {pedido.items && pedido.items.length > 0 ? (
                    pedido.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 bg-accent/20 text-accent text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            ×{item.cantidad}
                          </span>
                          <div className="min-w-0">
                            <span className="text-white font-bold text-xs leading-tight line-clamp-1">{item.nombre}</span>
                            {item.notas && (
                              <p className="text-[10px] text-yellow-400/70 italic mt-0.5 line-clamp-1">{item.notas}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-accent font-black text-xs shrink-0">
                          ${Number(item.subtotal).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600 italic">Sin detalle disponible</p>
                  )}
                </div>

                {/* Total del pedido */}
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-xs text-gray-400">Subtotal</span>
                  <span className="text-sm font-black text-white">${Number(pedido.total).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))
          )}

          {/* Ruleta */}
          <div className="pt-2">
            <button
              onClick={() => setShowRuleta(!showRuleta)}
              className="w-full py-3 flex items-center justify-between px-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all"
            >
              <span className="flex items-center gap-2 text-yellow-400 font-black text-xs uppercase tracking-widest">
                🎰 ¿Quién paga hoy?
              </span>
              <span className="text-yellow-400/60 text-xs">{showRuleta ? '▲ Ocultar' : '▼ Mostrar'}</span>
            </button>
            {showRuleta && <RouletteGame />}
          </div>
        </div>

        {/* Footer fijo */}
        <div className="p-4 bg-dark-900/80 border-t border-white/10 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total acumulado</span>
            <span className="text-2xl font-black text-accent">${totalPedidos.toLocaleString('es-AR')}</span>
          </div>
          <button
            disabled={pedidos.length === 0}
            onClick={onPedirCuenta}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-dark-900 font-black rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-sm shadow-lg shadow-yellow-500/20"
          >
            🧾 PEDIR LA CUENTA
          </button>
        </div>
      </div>
    </div>
  );
}
