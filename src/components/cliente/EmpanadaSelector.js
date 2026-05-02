'use client';
import { useState } from 'react';

export default function EmpanadaSelector({ product, isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  const flavours = [
    'Carne Suave', 'Carne Picante', 'Jamón y Queso', 'Humita', 'Roquefort', 'Cebolla y Queso', 'Pollo'
  ];

  const [quantities, setQuantities] = useState(flavours.reduce((acc, f) => ({ ...acc, [f]: 0 }), {}));
  const isPack = product.nombre.toLowerCase().includes('x');
  const targetQty = isPack ? parseInt(product.nombre.match(/\d+/)[0]) : null;
  const currentTotal = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleUpdate = (flavour, delta) => {
    setQuantities(prev => ({
      ...prev,
      [flavour]: Math.max(0, prev[flavour] + delta)
    }));
  };

  const handleConfirm = () => {
    const selected = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([f, qty]) => `${qty} ${f}`)
      .join(', ');
    onConfirm(product, selected, currentTotal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">{product.nombre}</h3>
          <p className="text-xs text-accent font-bold uppercase mt-1">
            {isPack ? `Elige tus ${targetQty} gustos` : 'Elige los gustos que quieras'}
          </p>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {flavours.map(f => (
            <div key={f} className="flex justify-between items-center">
              <span className="text-white font-bold">{f}</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleUpdate(f, -1)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white"
                > - </button>
                <span className="text-white font-black w-4 text-center">{quantities[f]}</span>
                <button 
                  onClick={() => handleUpdate(f, 1)}
                  className="w-8 h-8 rounded-lg bg-accent text-dark-900 flex items-center justify-center font-bold"
                > + </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white/5 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/50 uppercase font-black">Total Seleccionado</span>
            <span className={`text-lg font-black ${isPack && currentTotal !== targetQty ? 'text-red-400' : 'text-white'}`}>
              {currentTotal} {isPack && `/ ${targetQty}`}
            </span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-white/50 font-black uppercase text-[10px]">Cancelar</button>
            <button 
              disabled={isPack && currentTotal !== targetQty}
              onClick={handleConfirm}
              className="px-6 py-2 bg-accent text-dark-900 rounded-xl font-black uppercase text-[10px] disabled:opacity-30"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
