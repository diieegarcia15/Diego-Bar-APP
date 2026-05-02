'use client';

const SECTOR_ICON = { 'Adentro': '🏠', 'Patio': '🌿', 'Deck (Calle)': '🏙️' };
const SECTOR_COLOR = { 'Adentro': 'text-blue-400', 'Patio': 'text-green-400', 'Deck (Calle)': 'text-orange-400' };

export default function MesaPanel({ mesas, onMesaClick, onAddMesa, onDeleteMesa }) {
  const ocupadas   = mesas.filter(m => m.estado === 'ocupada').length;
  const porCobrar  = mesas.filter(m => m.estado === 'por_cobrar').length;
  const libres     = mesas.filter(m => m.estado === 'disponible').length;

  return (
    <aside className="w-full lg:w-80 bg-dark-900 border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-hidden">

      {/* Header compacto */}
      <div className="px-4 py-3 border-b border-white/5 bg-dark-800/30 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-black tracking-tight text-white">🗺️ PLANO SALÓN</h2>
          <span className="text-[10px] bg-dark-600 px-2 py-0.5 rounded text-gray-400 font-mono">{mesas.length} MESAS</span>
        </div>
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-gray-800/60 rounded-lg px-2 py-1 text-center">
            <div className="text-xs font-black text-gray-400">{libres}</div>
            <div className="text-[9px] text-gray-600 uppercase">Libres</div>
          </div>
          <div className="bg-red-500/10 rounded-lg px-2 py-1 text-center">
            <div className="text-xs font-black text-red-400">{ocupadas}</div>
            <div className="text-[9px] text-red-500/60 uppercase">Ocupadas</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg px-2 py-1 text-center">
            <div className="text-xs font-black text-yellow-400">{porCobrar}</div>
            <div className="text-[9px] text-yellow-500/60 uppercase">Cuenta</div>
          </div>
        </div>
      </div>

      {/* Mesas — todo en una sola vista sin scroll */}
      <div className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
        {['Adentro', 'Patio', 'Deck (Calle)'].map(sector => {
          const sectorMesas = mesas.filter(m => m.sector === sector);
          if (sectorMesas.length === 0) return null;

          return (
            <div key={sector} className="flex-1 min-h-0 flex flex-col">
              {/* Sector header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${SECTOR_COLOR[sector]}`}>
                  {SECTOR_ICON[sector]} {sector}
                </span>
                <button
                  onClick={() => onAddMesa(sector)}
                  className="w-5 h-5 flex items-center justify-center bg-accent/20 text-accent rounded text-xs font-black hover:bg-accent hover:text-dark-900 transition-all"
                  title={`Agregar mesa en ${sector}`}
                >
                  +
                </button>
              </div>

              {/* Grid de mesas — 3 columnas, altura adaptativa */}
              <div className="grid grid-cols-3 gap-1.5 flex-1">
                {sectorMesas.map(m => (
                  <div key={m.id} className="relative group">
                    <button
                      onClick={() => m.estado !== 'disponible' ? onMesaClick(m.id) : null}
                      className={`w-full h-full min-h-[54px] rounded-xl border transition-all duration-300 flex flex-col items-center justify-center py-1.5 ${
                        m.estado === 'disponible'
                          ? 'bg-dark-800/30 border-white/8 hover:border-white/20'
                          : m.estado === 'por_cobrar'
                            ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_12px_-4px_rgba(234,179,8,0.4)] animate-pulse-slow cursor-pointer'
                            : 'bg-red-500/10 border-red-500/50 hover:border-red-500 shadow-[0_0_12px_-4px_rgba(239,68,68,0.25)] cursor-pointer'
                      }`}
                    >
                      {/* Dot de estado */}
                      <div className={`w-1.5 h-1.5 rounded-full mb-0.5 ${
                        m.estado === 'disponible' ? 'bg-gray-600' :
                        m.estado === 'por_cobrar' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />

                      <span className={`text-[9px] font-bold uppercase leading-none ${
                        m.estado === 'disponible' ? 'text-gray-600' : 'text-gray-500'
                      }`}>Mesa</span>

                      <span className={`text-xl font-black leading-tight ${
                        m.estado === 'disponible' ? 'text-gray-500' : 'text-white'
                      }`}>{m.numero}</span>

                      <span className={`text-[8px] font-bold uppercase leading-none mt-0.5 ${
                        m.estado === 'por_cobrar' ? 'text-yellow-500' :
                        m.estado === 'ocupada'    ? 'text-red-400' : 'text-gray-700'
                      }`}>
                        {m.estado === 'por_cobrar' ? 'Cuenta' :
                         m.estado === 'ocupada'    ? 'Ocupada' : 'Libre'}
                      </span>

                      {/* Hover overlay */}
                      {m.estado !== 'disponible' && (
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                          <span className="text-[9px] font-black text-white bg-dark-900/80 px-1.5 py-0.5 rounded">VER</span>
                        </div>
                      )}
                    </button>

                    {/* Botón eliminar */}
                    {m.estado === 'disponible' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteMesa(m.id); }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
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

      {/* Leyenda compacta */}
      <div className="px-4 py-2 border-t border-white/5 bg-dark-800/30 shrink-0">
        <div className="flex justify-around">
          {[['bg-gray-600','Libre'],['bg-red-500','Ocupada'],['bg-yellow-500','Cuenta']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
              <span className="text-[9px] text-gray-500 uppercase font-bold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
