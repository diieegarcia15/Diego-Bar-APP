'use client';
import OrderCard from './OrderCard';

export default function OrderBoard({ orders, onUpdateStatus }) {
  const columns = [
    { id: 'recibido', title: '📥 RECIBIDOS', color: 'border-green-500' },
    { id: 'en_preparacion', title: '🍳 EN PREPARACIÓN', color: 'border-yellow-500' },
    { id: 'listo', title: '🥡 LISTOS PARA DESPACHO', color: 'border-blue-500' },
  ];

  const getOrdersByStatus = (status) => orders.filter(o => o.estado === status);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full overflow-hidden">
      {columns.map(col => (
        <div key={col.id} className="flex-1 flex flex-col min-w-[320px] max-h-full">
          <div className={`p-4 border-b-4 ${col.color} bg-dark-800/30 rounded-t-2xl mb-4`}>
            <h3 className="font-black text-sm tracking-widest flex justify-between items-center">
              {col.title}
              <span className="bg-white/5 px-2 py-0.5 rounded text-xs">{getOrdersByStatus(col.id).length}</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pb-10 scrollbar-hide">
            {getOrdersByStatus(col.id).map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={onUpdateStatus} 
              />
            ))}
            
            {getOrdersByStatus(col.id).length === 0 && (
              <div className="py-10 text-center opacity-20 border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-xs font-bold italic">SIN PEDIDOS</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
