'use client';
import { useEffect } from 'react';

export default function OrderConfirm({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="glass-card w-full max-w-sm rounded-3xl p-8 relative animate-scale-in text-center space-y-6">
        <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl animate-bounce">✅</span>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">¡PEDIDO ENVIADO!</h2>
          <p className="text-gray-400">Tu orden ha sido recibida en la cocina. ¡En breve estará lista!</p>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-4 bg-accent text-dark-900 font-bold rounded-2xl hover:bg-accent-dark transition-colors shadow-glow-green"
        >
          ENTENDIDO
        </button>
      </div>
    </div>
  );
}
