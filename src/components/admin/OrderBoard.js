import { useMemo } from 'react';
import OrderCard from './OrderCard';

export default function OrderBoard({ orders, onUpdateStatus }) {
  const groupedOrders = useMemo(() => {
    const groups = { recibido: [], en_preparacion: [], listo: [] };
    for (const order of orders) {
      if (groups[order.estado]) {
        groups[order.estado].push(order);
      }
    }
    return groups;
  }, [orders]);

  const columns = [
    { id: 'recibido', title: '📥 RECIBIDOS', color: 'border-green-500', bg: 'bg-green-500/5' },
    { id: 'en_preparacion', title: '🍳 EN PREPARACIÓN', color: 'border-yellow-500', bg: 'bg-yellow-500/5' },
    { id: 'listo', title: '🥡 DESPACHO', color: 'border-blue-500', bg: 'bg-blue-500/5' },
  ];

  return (
    <aside className="w-full lg:w-80 bg-dark-900 border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-dark-800/30 shrink-0">
        <h2 className="text-sm font-black tracking-tight text-white uppercase tracking-widest">📋 Comandas en Vivo</h2>
        <p className="text-[10px] text-gray-500 font-bold mt-1">ESTADO DE COCINA</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
        {columns.map(col => {
          const colOrders = groupedOrders[col.id] || [];
          return (
            <div key={col.id} className="space-y-3">
              <div className={`p-2 border-l-4 ${col.color} ${col.bg} rounded-r-lg flex justify-between items-center`}>
                <h3 className="font-black text-[10px] tracking-widest text-white uppercase">
                  {col.title}
                </h3>
                <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-mono">{colOrders.length}</span>
              </div>
              
              <div className="space-y-3">
                {colOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={onUpdateStatus} 
                    compact={true}
                  />
                ))}
                
                {colOrders.length === 0 && (
                  <div className="py-4 text-center opacity-20 border border-dashed border-white/5 rounded-xl">
                    <p className="text-[9px] font-bold italic">VACÍO</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
