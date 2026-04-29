import { useState } from 'react';
import RouletteGame from './RouletteGame';

export default function BillModal({ type, isOpen, onClose, onConfirm }) {
  const [showGame, setShowGame] = useState(false);
  
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className={`glass-card w-full ${showGame ? 'max-w-md' : 'max-w-sm'} rounded-[2.5rem] p-8 relative animate-in zoom-in duration-300 text-center space-y-6 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar font-[family-name:var(--font-pt-sans-narrow)]`}>
        {!showGame && (
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isConfirm ? 'bg-yellow-500/20' : 'bg-accent/20'}`}>
            <span className="text-5xl animate-bounce">
              {isConfirm ? '🧾' : '✅'}
            </span>
          </div>
        )}
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {isConfirm ? '¿Pedir la cuenta?' : '¡Solicitud enviada!'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {isConfirm 
              ? '¿Deseas que el personal traiga la cuenta a tu mesa ahora?' 
              : 'El personal ha recibido tu solicitud. En unos instantes te traeremos la cuenta.'}
          </p>
        </div>
        
        <div className="space-y-3 pt-2">
          {isConfirm ? (
            <>
              {!showGame ? (
                <>
                  <button 
                    onClick={onConfirm}
                    className="w-full py-4 bg-yellow-500 text-dark-900 font-black rounded-2xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                  >
                    SÍ, PEDIR CUENTA
                  </button>
                  <button 
                    onClick={() => setShowGame(true)}
                    className="w-full py-4 bg-white/5 text-yellow-500 border border-yellow-500/20 font-bold rounded-2xl hover:bg-yellow-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    🎲 ¿QUIÉN PAGA?
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-4 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                  >
                    CANCELAR
                  </button>
                </>
              ) : (
                <>
                  <RouletteGame />
                  <div className="flex gap-3 mt-6">
                    <button 
                      type="button"
                      onClick={onConfirm}
                      className="flex-1 py-3 bg-yellow-500 text-dark-900 font-black rounded-xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-500/20 active:scale-95 text-xs"
                    >
                      PEDIR CUENTA
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowGame(false)}
                      className="flex-1 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all active:scale-95 text-xs"
                    >
                      VOLVER
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <button 
              onClick={onClose}
              className="w-full py-4 bg-accent text-dark-900 font-black rounded-2xl hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 active:scale-95"
            >
              ENTENDIDO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
