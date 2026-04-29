'use client';
import { useState, useEffect } from 'react';

export default function CustomizerModal({ product, isOpen, onClose, onConfirm }) {
  const [ingredients, setIngredients] = useState([]);
  const [removed, setRemoved] = useState([]);

  useEffect(() => {
    if (product?.descripcion) {
      // Intentar extraer ingredientes de la descripción
      // Asumimos que están separados por comas o " y "
      const raw = product.descripcion
        .replace(/ y /g, ', ')
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 2 && !i.toLowerCase().includes('con '));
      
      setIngredients(raw);
      setRemoved([]);
    }
  }, [product]);

  const toggleIngredient = (ing) => {
    setRemoved(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const handleConfirm = () => {
    const notas = removed.length > 0 
      ? `SIN: ${removed.join(', ')}` 
      : '';
    onConfirm(product, notas, 1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative glass-card w-full max-w-md rounded-3xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-900/50">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Personalizar</h2>
            <p className="text-xs text-accent font-bold uppercase tracking-widest">¿Querés quitar algún ingrediente?</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400">✕</button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {ingredients.length > 0 ? (
            ingredients.map((ing, idx) => (
              <button
                key={idx}
                onClick={() => toggleIngredient(ing)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  removed.includes(ing)
                    ? 'bg-red-500/10 border-red-500/50 text-red-500'
                    : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                }`}
              >
                <span className="font-bold capitalize">{ing}</span>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                   removed.includes(ing) ? 'bg-red-500 border-red-500' : 'border-white/20'
                }`}>
                  {removed.includes(ing) && <span className="text-white text-xs">✕</span>}
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-gray-500 italic py-10">No se encontraron ingredientes para personalizar</p>
          )}
        </div>

        <div className="p-6 bg-dark-900/80 border-t border-white/10">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-accent hover:bg-accent-dark text-dark-900 font-black rounded-2xl shadow-glow-green transition-all active:scale-95 uppercase tracking-widest text-sm"
          >
            Agregar al Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
