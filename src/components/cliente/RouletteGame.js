'use client';
import { useState, useRef } from 'react';
import { Plus, Trash2, RotateCw, User, Trophy } from 'lucide-react';

export default function RouletteGame() {
  const [names, setNames] = useState([]);
  const [newName, setNewName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const wheelRef = useRef(null);

  const colors = [
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Emerald
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F97316', // Orange
    '#06B6D4', // Cyan
  ];

  const addName = (e) => {
    e?.preventDefault();
    const nameToAdd = newName.trim();
    if (nameToAdd && !isSpinning && names.length < 12) {
      setNames(prev => [...prev, nameToAdd]);
      setNewName('');
      setWinner(null);
    }
  };

  const removeName = (index) => {
    if (!isSpinning) {
      setNames(prev => prev.filter((_, i) => i !== index));
      setWinner(null);
    }
  };

  const spin = () => {
    if (names.length < 2 || isSpinning) return;

    setIsSpinning(true);
    setWinner(null);
    
    // Random rotation: at least 8 full turns + random offset
    const extraDegrees = Math.floor(Math.random() * 360);
    const spins = 8 + Math.floor(Math.random() * 5);
    const currentRotation = rotation;
    const totalRotation = currentRotation + (spins * 360) + extraDegrees;
    
    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      
      const actualDegrees = totalRotation % 360;
      const segmentSize = 360 / names.length;
      
      // The arrow is at top (0 deg). Wheel rotates clockwise.
      const winningIndex = Math.floor((360 - actualDegrees) / segmentSize) % names.length;
      setWinner(names[winningIndex]);
    }, 4000);
  };

  return (
    <div className="space-y-6 pt-4 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 font-[family-name:var(--font-pt-sans-narrow)]">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-500 mb-2">
          <RotateCw className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tight">
          ¿Quién paga hoy?
        </h3>
        <p className="text-xs text-gray-400 font-medium">¿Quién se paga la vuelta?..</p>
      </div>

      <form onSubmit={addName} className="relative group">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del valiente..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all placeholder:text-gray-600"
          disabled={isSpinning || names.length >= 12}
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 bg-yellow-500 hover:bg-yellow-600 text-dark-900 px-4 rounded-xl transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 active:scale-95"
          disabled={isSpinning || !newName.trim() || names.length >= 12}
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {names.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center py-2 px-2">
          {names.map((name, i) => (
            <div 
              key={i} 
              className="bg-white/5 text-gray-300 text-[11px] font-bold pl-3 pr-2 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 group animate-in zoom-in duration-200"
            >
              <User className="w-3 h-3 text-yellow-500/50" />
              {name}
              {!isSpinning && (
                <button 
                  type="button"
                  onClick={() => removeName(i)} 
                  className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {names.length >= 2 ? (
        <div className="relative flex flex-col items-center py-6">
          {/* Roulette Wheel Container */}
          <div className="relative w-56 h-56 mb-8">
            {/* Outer Glow */}
            <div className={`absolute inset-[-10px] rounded-full blur-2xl transition-all duration-1000 ${isSpinning ? 'bg-yellow-500/20 animate-pulse' : 'bg-transparent'}`} />
            
            {/* Arrow Indicator */}
            <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
              <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-yellow-500" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full mt-1 opacity-50" />
            </div>
            
            <div 
              ref={wheelRef}
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)',
                background: `conic-gradient(${names.map((_, i) => {
                  const start = (i * 360) / names.length;
                  const end = ((i + 1) * 360) / names.length;
                  return `${colors[i % colors.length]} ${start}deg ${end}deg`;
                }).join(', ')})`
              }}
              className="w-full h-full rounded-full border-[6px] border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden flex items-center justify-center ring-1 ring-white/20"
            >
              {/* Names around the wheel */}
              {names.map((name, i) => {
                const angle = (i * 360 / names.length) + (180 / names.length);
                return (
                  <div 
                    key={i}
                    className="absolute text-[9px] font-black text-white uppercase tracking-tighter w-24 text-right pr-4 origin-left left-1/2 top-1/2 -translate-y-1/2"
                    style={{
                      transform: `rotate(${angle - 90}deg)`,
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    <span className="inline-block" style={{ transform: 'rotate(0deg)' }}>
                      {name}
                    </span>
                  </div>
                );
              })}
              
              {/* Center Cap */}
              <div className="absolute w-12 h-12 bg-dark-900 rounded-full border-4 border-white/10 z-20 flex items-center justify-center shadow-inner">
                <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={spin}
            disabled={isSpinning}
            className={`w-full py-5 rounded-[2rem] font-black text-sm tracking-[0.2em] transition-all duration-300 transform active:scale-95 ${
              isSpinning 
                ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' 
                : 'bg-white text-dark-900 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1'
            }`}
          >
            {isSpinning ? '¡SUERTE...!' : 'GIRAR LA RULETA'}
          </button>

          {winner && !isSpinning && (
            <div className="mt-8 animate-in zoom-in slide-in-from-top-4 duration-500 text-center w-full">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12 transition-transform group-hover:scale-150 duration-700">
                  <Trophy className="w-16 h-16" />
                </div>
                <span className="text-yellow-500 text-[10px] block mb-2 uppercase font-black tracking-[0.3em]">Habemus perdedor:</span>
                <span className="text-3xl font-black text-white drop-shadow-lg block">
                  {winner}
                </span>
                <p className="text-xs text-gray-400 mt-3 italic font-medium">"Hoy invita la casa... de {winner}"</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 px-6 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 space-y-3">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
            <User className="w-6 h-6" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Agreguen al menos dos personas para jugar</p>
        </div>
      )}
    </div>
  );
}
