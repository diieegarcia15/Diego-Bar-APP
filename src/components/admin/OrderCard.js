'use client';
import OrderTimer from './OrderTimer';
import StatusBadge from '../shared/StatusBadge';

export default function OrderCard({ order, onUpdateStatus }) {
  return (
    <div className="glass-card rounded-3xl border-l-8 border-l-accent overflow-hidden animate-slide-right">
      <div className="p-5 flex justify-between items-start bg-dark-600/50">
        <div>
          <span className="bg-white/10 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase mr-2">Mesa {order.mesa_numero}</span>
          <StatusBadge status={order.estado} />
          <span className="text-gray-400 text-xs font-mono ml-2">#{order.id}</span>
        </div>
        <OrderTimer createdAt={order.created_at} />
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="border-b border-white/5 pb-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold"><span className="text-accent">x{item.cantidad}</span> {item.producto_nombre}</span>
                <span className="text-gray-400 font-mono">${item.subtotal.toLocaleString('es-AR')}</span>
              </div>
              {item.notas && (
                <p className="text-[10px] text-gray-500 font-medium italic mt-1 leading-tight">
                  ↳ {item.notas}
                </p>
              )}
            </div>
          ))}
        </div>

        {order.notas && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl text-xs text-yellow-500 italic">
            📝 {order.notas}
          </div>
        )}

        <div className="pt-4 flex gap-2">
          {order.estado === 'recibido' && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'en_preparacion')}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-dark-900 border border-transparent rounded-xl p-3 text-sm font-bold transition-all cursor-pointer"
            >
              ▶ PASAR A PREPARACIÓN
            </button>
          )}
          {order.estado === 'en_preparacion' && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'listo')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border border-transparent rounded-xl p-3 text-sm font-bold transition-all cursor-pointer"
            >
              ▶ LISTO PARA DESPACHO
            </button>
          )}
          {order.estado === 'listo' && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'entregado')}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white border border-transparent rounded-xl p-3 text-sm font-bold transition-all cursor-pointer shadow-glow-green"
            >
              ▶ MARCAR ENTREGADO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
