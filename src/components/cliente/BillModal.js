'use client';

export default function BillModal({ type, isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-800 border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl text-center p-8">
        {type === 'confirm' ? (
          <>
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🧾</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">¿Pedir la cuenta?</h3>
            <p className="text-white/60 text-sm mb-8">Un mozo se acercará a tu mesa para procesar el pago.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onConfirm}
                className="w-full py-4 bg-accent text-dark-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-glow-green"
              >
                SÍ, PEDIR CUENTA
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 text-white/40 font-black uppercase tracking-widest text-[10px]"
              >
                CANCELAR
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">¡Solicitud Enviada!</h3>
            <p className="text-white/60 text-sm mb-8">El mozo ya está en camino a la mesa.</p>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              ENTENDIDO
            </button>
          </>
        )}
      </div>
    </div>
  );
}
