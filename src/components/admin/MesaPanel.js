'use client';

export default function MesaPanel({ mesas, onMesaClick, onAddMesa, onDeleteMesa }) {
  return (
    <aside className="w-full lg:w-72 bg-dark-900 border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-dark-800/30">
        <div className="flex justify-between items-baseline mb-1">
          <h2 className="text-lg font-bold tracking-tight">🗺️ PLANO SALÓN</h2>
          <span className="text-[10px] bg-dark-600 px-2 py-0.5 rounded text-gray-400 font-mono">{mesas.length} MESAS</span>
        </div>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Estado en tiempo real</p>
      </div>

      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-8">
        {['Adentro', 'Patio', 'Deck (Calle)'].map(sector => {
          const sectorMesas = mesas.filter(m => m.sector === sector);
          
          return (
            <div key={sector} className="space-y-4">
              <div className="flex items-center justify-between px-2 mb-2 border-b border-white/5 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">{sector}</h3>
                <button 
                  onClick={() => onAddMesa(sector)}
                  className="w-7 h-7 flex items-center justify-center bg-accent text-dark-900 rounded-lg text-sm font-black hover:shadow-glow-green transition-all"
                  title={`Agregar mesa en ${sector}`}
                >
                  +
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {sectorMesas.map(m => (
                  <div key={m.id} className="relative group">
                    <button 
                      onClick={() => m.estado !== 'disponible' ? onMesaClick(m.id) : null}
                      className={`w-full aspect-square rounded-xl border transition-all duration-300 flex flex-col items-center justify-center ${
                        m.estado === 'disponible' 
                          ? 'bg-dark-800/20 border-white/10 hover:border-white/20' 
                          : m.estado === 'por_cobrar'
                            ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)] animate-pulse-slow'
                            : 'bg-red-500/10 border-red-500/50 hover:border-red-500 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]'
                      }`}
                    >
                      {/* Indicador de estado superior */}
                      <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                        m.estado === 'disponible' ? 'bg-gray-600' : m.estado === 'por_cobrar' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />

                      <span className={`text-[10px] font-bold uppercase tracking-tighter mb-0.5 ${
                        m.estado === 'disponible' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        MESA
                      </span>
                      <span className={`text-2xl font-black leading-none ${
                        m.estado === 'disponible' ? 'text-gray-400' : 'text-white'
                      }`}>
                        {m.numero}
                      </span>

                      {/* Info inferior (tipo Tableo) */}
                      <div className="mt-2 flex flex-col items-center">
                        {m.estado === 'por_cobrar' ? (
                          <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                            Pide Cuenta
                          </span>
                        ) : m.estado === 'ocupada' ? (
                          <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                            Ocupada
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">
                            Libre
                          </span>
                        )}
                      </div>

                      {/* Efecto hover interactivo para mesas ocupadas */}
                      {m.estado !== 'disponible' && (
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white tracking-widest bg-dark-900/80 px-2 py-1 rounded">VER DETALLE</span>
                        </div>
                      )}
                    </button>

                    {/* Botón eliminar (solo si está disponible) */}
                    {m.estado === 'disponible' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteMesa(m.id); }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5 bg-dark-800/30">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-gray-600 mb-1"></div>
            <span className="text-[8px] text-gray-500 uppercase font-bold">Libre</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mb-1"></div>
            <span className="text-[8px] text-gray-500 uppercase font-bold">Ocupada</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mb-1"></div>
            <span className="text-[8px] text-gray-500 uppercase font-bold">Cuenta</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
