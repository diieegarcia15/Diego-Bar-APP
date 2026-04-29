'use client';

export default function MisPedidos({ pedidos, isOpen, onClose, onPedirCuenta }) {
  if (!isOpen) return null;

  // Calcular totales
  const totalPedidos = pedidos.reduce((acc, pedido) => acc + Number(pedido.total), 0);
  const totalTax = totalPedidos * 0.05; // Asumiendo 5% como en el carrito
  const total = totalPedidos + totalTax;

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'recibido': return 'bg-accent/20 text-accent';
      case 'en_preparacion': return 'bg-yellow-500/20 text-yellow-500';
      case 'listo': return 'bg-blue-500/20 text-blue-500';
      case 'entregado': return 'bg-green-600/20 text-green-500';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'recibido': return 'Recibido';
      case 'en_preparacion': return 'Preparando';
      case 'listo': return 'Listo';
      case 'entregado': return 'Entregado';
      default: return estado;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative glass-card rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <span className="mr-2">📝</span> Mis Pedidos
          </h2>
          <button onClick={onClose} className="p-2 bg-dark-700 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pedidos.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">
              Aún no has realizado pedidos
            </div>
          ) : (
            pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-dark-800/50 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-sm text-gray-400">
                    {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getStatusColor(pedido.estado)}`}>
                    {getStatusText(pedido.estado)}
                  </span>
                </div>
                <div className="space-y-2">
                  {pedido.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{item.cantidad}x</span>
                        <span>{item.nombre}</span>
                      </div>
                      <span className="text-accent">${Number(item.subtotal).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-dark-800/80 space-y-4 rounded-t-3xl border-t border-white/10">
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal Pedidos</span>
              <span>${totalPedidos.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuestos (5%)</span>
              <span>${totalTax.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-white/5">
              <span>Total a Pagar</span>
              <span className="text-accent">${total.toLocaleString('es-AR')}</span>
            </div>
          </div>
          <button
            disabled={pedidos.length === 0}
            onClick={onPedirCuenta}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-dark-900 font-bold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:grayscale"
          >
            PEDIR LA CUENTA
          </button>
        </div>
      </div>
    </div>
  );
}
