'use client';

const SECTOR_ICON = { 'Adentro': '🏠', 'Patio': '🌿', 'Deck (Calle)': '🏙️' };
const SECTOR_COLOR = { 'Adentro': 'text-blue-400', 'Patio': 'text-green-400', 'Deck (Calle)': 'text-orange-400' };

export default function MesaPanel({ mesas, onMesaClick, onAddMesa, onDeleteMesa }) {
  const ocupadas   = mesas.filter(m => m.estado === 'ocupada').length;
  const porCobrar  = mesas.filter(m => m.estado === 'por_cobrar').length;
  const libres     = mesas.filter(m => m.estado === 'disponible').length;

  return (
    <div className="flex-1 flex flex-col h-full space-y-6">
      {/* Stats bar horizontal */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="glass-card bg-dark-800/40 rounded-3xl p-4 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-500/20 flex items-center justify-center text-xl text-gray-500">🏠</div>
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none">MESAS LIBRES</p>
              <p className="text-2xl font-black text-white leading-tight">{libres}</p>
            </div>
          </div>
        </div>
        <div className="glass-card bg-red-500/5 rounded-3xl p-4 flex items-center justify-between border border-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center text-xl text-red-500">🍳</div>
            <div>
              <p className="text-[10px] text-red-500/60 font-black uppercase tracking-widest leading-none">MESAS OCUPADAS</p>
              <p className="text-2xl font-black text-white leading-tight">{ocupadas}</p>
            </div>
          </div>
        </div>
        <div className="glass-card bg-yellow-500/5 rounded-3xl p-4 flex items-center justify-between border border-yellow-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-xl text-yellow-500">🧾</div>
            <div>
              <p className="text-[10px] text-yellow-500/60 font-black uppercase tracking-widest leading-none">PIDEN CUENTA</p>
              <p className="text-2xl font-black text-white leading-tight">{porCobrar}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plano de Mesas - Mucho más grande */}
      <div className="flex-1 glass-card bg-dark-800/20 rounded-[2.5rem] border border-white/5 p-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-12">
          {['Adentro', 'Patio', 'Deck (Calle)'].map(sector => {
            const sectorMesas = mesas.filter(m => m.sector === sector);
            if (sectorMesas.length === 0) return null;

            return (
              <div key={sector} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{SECTOR_ICON[sector]}</span>
                    <div>
                      <h3 className={`text-xl font-black uppercase tracking-[0.2em] ${SECTOR_COLOR[sector]}`}>{sector}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{sectorMesas.length} Mesas en este sector</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddMesa(sector)}
                    className="px-4 py-2 bg-accent text-dark-900 rounded-xl text-xs font-black hover:shadow-glow-green transition-all uppercase tracking-widest"
                  >
                    + Agregar Mesa
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {sectorMesas.map(m => (
                    <div key={m.id} className="relative group">
                      <button
                        onClick={() => m.estado !== 'disponible' ? onMesaClick(m.id) : null}
                        className={`w-full aspect-[4/3] rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden ${
                          m.estado === 'disponible'
                            ? 'bg-dark-800/40 border-white/10 hover:border-white/30'
                            : m.estado === 'por_cobrar'
                              ? 'bg-yellow-500/10 border-yellow-500 shadow-glow-yellow animate-pulse-slow'
                              : 'bg-red-500/10 border-red-500 shadow-glow-red'
                        }`}
                      >
                        {/* Indicador de estado */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                          m.estado === 'disponible' ? 'bg-gray-700' : 
                          m.estado === 'por_cobrar' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />

                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                          m.estado === 'disponible' ? 'text-gray-600' : 'text-gray-500'
                        }`}>Mesa</span>
                        
                        <span className={`text-4xl font-black ${
                          m.estado === 'disponible' ? 'text-gray-500' : 'text-white'
                        }`}>{m.numero}</span>

                        <div className="mt-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            m.estado === 'por_cobrar' ? 'bg-yellow-500/20 text-yellow-500' :
                            m.estado === 'ocupada'    ? 'bg-red-500/20 text-red-500' : 
                            'bg-gray-800 text-gray-600'
                          }`}>
                            {m.estado === 'por_cobrar' ? 'Cuenting' :
                             m.estado === 'ocupada'    ? 'Comiendo' : 'Vacía'}
                          </span>
                        </div>

                        {/* Hover interactivo */}
                        {m.estado !== 'disponible' && (
                          <div className="absolute inset-0 bg-dark-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white text-dark-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Ver Pedidos</span>
                          </div>
                        )}
                      </button>

                      {/* Eliminar */}
                      {m.estado === 'disponible' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteMesa(m.id); }}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl z-10"
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
      </div>
    </div>
  );
}
