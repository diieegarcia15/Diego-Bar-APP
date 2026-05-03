import { useEffect, useState } from 'react';

export default function UnifiedOrderDrawer({ 
  mesa, 
  cart = [],
  onUpdateQty,
  onRemoveItem,
  onConfirmOrder,
  onOpenPedidos, 
  onPedirCuenta
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Abrir automticamente cuando se agrega algo al carrito
  useEffect(() => {
    if (cart.length > 0) {
      setIsOpen(true);
    }
  }, [cart.length]);

  const totalCart = cart.reduce((acc, item) => acc + (Number(item.precio || 0) * Number(item.cantidad || 0)), 0);

  return (
    <div className={`fixed bottom-10 right-0 z-[60] transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'}`}>
      <div className="flex items-end">
        {/* Pestaa / Flechita con Badge */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-24 bg-accent text-dark-900 rounded-l-2xl shadow-2xl flex flex-col items-center justify-center group border-y border-l border-white/20 mb-6 relative"
        >
          {cart.length > 0 && (
            <span className="absolute -top-2 -left-2 bg-white text-dark-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              {cart.length}
            </span>
          )}
          <span className={`text-xl transition-transform duration-500 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            \u25c0
          </span>
        </button>

        {/* Panel Contenido */}
        <div className="bg-dark-800/95 backdrop-blur-2xl border-l border-white/10 w-80 h-auto max-h-[85vh] overflow-y-auto p-6 rounded-tl-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col custom-scrollbar">
          <div className="space-y-1 mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent opacity-70">Tu Mesa</h3>
            <p className="text-2xl font-bold text-white uppercase">Mesa {mesa?.numero}</p>
          </div>

          {/* Seccin de Carrito / Pedido Nuevo */}
          {cart.length > 0 && (
            <div className="space-y-4 mb-8 animate-fade-in">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white border-b border-white/10 pb-2">Verificar Pedido</h4>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex flex-col gap-1 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white leading-tight flex-1">{item.nombre}</span>
                      <button onClick={() => onRemoveItem(item.cartId)} className="text-gray-500 hover:text-red-500 text-[10px] ml-2">\u2715</button>
                    </div>
                    {item.notas && <p className="text-[9px] text-gray-400 italic">"{item.notas}"</p>}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-3">
                        <button onClick={() => onUpdateQty(item.cartId, -1)} className="w-5 h-5 flex items-center justify-center bg-white/10 rounded-lg text-xs font-bold">-</button>
                        <span className="text-xs font-black">{item.cantidad}</span>
                        <button onClick={() => onUpdateQty(item.cartId, 1)} className="w-5 h-5 flex items-center justify-center bg-white/10 rounded-lg text-xs font-bold">+</button>
                      </div>
                      <span className="text-xs font-black text-accent">${(Number(item.precio || 0) * Number(item.cantidad || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-white font-black text-xs uppercase tracking-widest mb-4">
                  <span>Total Pedido:</span>
                  <span className="text-accent">${(Number(totalCart) || 0).toLocaleString()}</span>
                </div>
                <button 
                  onClick={onConfirmOrder}
                  className="w-full py-4 bg-accent text-dark-900 font-black rounded-2xl shadow-glow-green hover:scale-[1.02] transition-all text-xs uppercase tracking-widest"
                >
                  Confirmar y Enviar \ud83d\ude80
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 mt-auto">
            {/* Botn Pedir Cuenta */}
            <button 
              onClick={() => {
                onPedirCuenta();
                setIsOpen(false);
              }}
              className="w-full py-5 bg-white text-dark-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform text-xs uppercase tracking-[0.1em]"
            >
              <span>\ud83d\udcb5 Pedir la Cuenta</span>
            </button>

                <button 
                  onClick={() => {
                    onOpenPedidos();
                    setIsOpen(false);
                  }}
                  className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  <span>\ud83d\udcdc Mi Consumo Detallado</span>
                </button>
          </div>
        </div>
      </div>
    </div>
  );
}
