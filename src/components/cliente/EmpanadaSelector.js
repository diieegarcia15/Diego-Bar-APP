'use client';
import { useState, useEffect } from 'react';

export default function EmpanadaSelector({ product, isOpen, onClose, onConfirm }) {
  const [varieties, setVarieties] = useState([
    { id: 'carne', nombre: 'Carne', cantidad: 0 },
    { id: 'jamon_queso', nombre: 'Jamón y Queso', cantidad: 0 },
    { id: 'pollo', nombre: 'Pollo', cantidad: 0 },
    { id: 'queso_cebolla', nombre: 'Queso y Cebolla', cantidad: 0 },
    { id: 'humita', nombre: 'Humita', cantidad: 0 },
    { id: 'verdura', nombre: 'Verdura', cantidad: 0 },
  ]);

  const [totalSelected, setTotalSelected] = useState(0);

  // Intentar extraer el número de unidades del nombre del producto (ej: "Empanadas x6")
  const match = product?.nombre?.match(/x(\d+)/i);
  const targetQuantity = match ? parseInt(match[1]) : 1;

  useEffect(() => {
    const total = varieties.reduce((acc, v) => acc + v.cantidad, 0);
    setTotalSelected(total);
  }, [varieties]);

  const updateVarietyQty = (id, delta) => {
    setVarieties(prev => prev.map(v => {
      if (v.id === id) {
        const newQty = Math.max(0, v.cantidad + delta);
        // Si el producto tiene una cantidad fija (ej: x6), no permitir pasarse
        if (targetQuantity > 1 && totalSelected + (newQty - v.cantidad) > targetQuantity) {
            return v;
        }
        return { ...v, cantidad: newQty };
      }
      return v;
    }));
  };

  const handleConfirm = () => {
    const selected = varieties.filter(v => v.cantidad > 0);
    const notas = selected.map(v => `${v.cantidad} ${v.nombre}`).join(', ');
    
    // Si el producto es por unidad, sumamos todas las unidades seleccionadas
    // Si es un pack (x6, x12), el producto en sí ya representa esa cantidad en el carrito,
    // pero guardamos el detalle en las notas.
    
    onConfirm(product, notas, totalSelected);
    onClose();
  };

  if (!isOpen) return null;

  const isComplete = targetQuantity === 1 ? totalSelected > 0 : totalSelected === targetQuantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative glass-card w-full max-w-md rounded-3xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-900/50">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Seleccioná Variedades</h2>
            <p className="text-xs text-accent font-bold uppercase tracking-widest">
              {targetQuantity > 1 ? `Elegí ${targetQuantity} unidades` : 'Elegí tus sabores'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400">✕</button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {varieties.map((v) => (
            <div key={v.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="font-bold text-white">{v.nombre}</span>
              <div className="flex items-center gap-4 bg-dark-900 rounded-xl p-1 px-3">
                <button 
                  onClick={() => updateVarietyQty(v.id, -1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  -
                </button>
                <span className="font-black text-accent min-w-[20px] text-center">{v.cantidad}</span>
                <button 
                  onClick={() => updateVarietyQty(v.id, 1)}
                  className={`w-8 h-8 flex items-center justify-center text-accent hover:scale-110 transition-transform ${targetQuantity > 1 && totalSelected >= targetQuantity ? 'opacity-20 pointer-events-none' : ''}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-dark-900/80 border-t border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-400 uppercase">Total seleccionado</span>
            <span className={`text-lg font-black ${isComplete ? 'text-accent' : 'text-white'}`}>
              {totalSelected} / {targetQuantity > 1 ? targetQuantity : '∞'}
            </span>
          </div>

          <button
            disabled={!isComplete}
            onClick={handleConfirm}
            className="w-full py-4 bg-accent hover:bg-accent-dark text-dark-900 font-black rounded-2xl shadow-glow-green transition-all active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-widest text-sm"
          >
            {targetQuantity > 1 && totalSelected < targetQuantity 
              ? `Faltan ${targetQuantity - totalSelected} unidades`
              : 'Confirmar Variedades'}
          </button>
        </div>
      </div>
    </div>
  );
}
