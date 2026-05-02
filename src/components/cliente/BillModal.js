'use client';
import { useState } from 'react';
import RouletteGame from './RouletteGame';

export default function BillModal({ type, isOpen, onClose, onConfirm }) {
  const [showGame, setShowGame] = useState(false);
  if (!isOpen) return null;
  const isConfirm = type === 'confirm';
  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-md" onClick={onClose} />
      <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 relative animate-in zoom-in duration-300 text-center space-y-6">
        {isConfirm && !showGame && (
          <>
            <div className="text-5xl">🧾</div>
            <h2 className="text-2xl font-black uppercase">¿Pedir la cuenta?</h2>
            <div className="space-y-3">
              <button onClick={onConfirm} className="w-full py-4 bg-yellow-500 text-dark-900 font-black rounded-2xl uppercase text-xs">SÍ, PEDIR CUENTA</button>
              <button onClick={() => setShowGame(true)} className="w-full py-4 bg-white/5 text-yellow-500 border border-yellow-500/20 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs uppercase">🎲 ¿QUIÉN PAGA? (RULETA)</button>
              <button onClick={onClose} className="w-full py-4 bg-white/5 text-gray-500 font-bold rounded-2xl text-xs">CANCELAR</button>
            </div>
          </>
        )}
        {isConfirm && showGame && (
          <div className="animate-in fade-in duration-300">
            <RouletteGame />
            <div className="flex gap-3 mt-6">
              <button onClick={onConfirm} className="flex-1 py-3 bg-yellow-500 text-dark-900 font-black rounded-xl text-[10px]">PEDIR CUENTA</button>
              <button onClick={() => setShowGame(false)} className="flex-1 py-3 bg-white/5 text-gray-400 font-bold rounded-xl text-[10px]">VOLVER</button>
            </div>
          </div>
        )}
        {isSuccess && (
          <>
            <div className="text-5xl animate-bounce">✅</div>
            <h2 className="text-2xl font-black uppercase">¡Enviado!</h2>
            <p className="text-gray-400 text-sm">El mozo ya viene con tu cuenta.</p>
            <button onClick={onClose} className="w-full py-4 bg-accent text-dark-900 font-black rounded-2xl text-xs uppercase">ENTENDIDO</button>
          </>
        )}
      </div>
    </div>
  );
}
