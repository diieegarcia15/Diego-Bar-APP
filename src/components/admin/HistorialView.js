'use client';
import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';

export default function HistorialView({ isOpen, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lista'); // 'lista' o 'calendario'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistorial();
    }
  }, [isOpen]);

  async function loadHistorial() {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await api.getHistorial();
      setHistorial(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron cargar los registros');
    } finally {
      setIsLoading(false);
    }
  }

  // Filtrar solo lo no procesado para la pestaña Lista
  const historialFiltrado = useMemo(() => {
    return historial.filter(h => !h.procesado);
  }, [historial]);

  // Agrupar historial por fecha para el calendario (aquí incluimos TODO)
  const statsByDate = useMemo(() => {
    const stats = {};
    historial.forEach(entry => {
      const dateKey = new Date(entry.cerrado_at).toISOString().split('T')[0];
      if (!stats[dateKey]) {
        stats[dateKey] = {
          total: 0,
          count: 0,
          entries: []
        };
      }
      stats[dateKey].total += entry.total;
      stats[dateKey].count += 1;
      stats[dateKey].entries.push(entry);
    });
    return stats;
  }, [historial]);

  async function handleReiniciarHistorial() {
    try {
      setIsLoading(true);
      setShowConfirm(false);
      await api.reiniciarHistorial();
      // Volver a cargar para obtener el estado 'procesado' actualizado
      await loadHistorial();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al reiniciar recaudación: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div 
        className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="w-full max-w-2xl bg-dark-800 h-full shadow-2xl relative animate-slide-left flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-900/50">
          <div>
            <h2 className="text-2xl font-black">📜 Historial de Ventas</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Registros de mesas cerradas</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 space-x-2 bg-dark-900/50">
          <button 
            onClick={() => setActiveTab('lista')}
            className={`flex-1 py-3 text-sm font-bold rounded-t-2xl transition-all ${
              activeTab === 'lista' 
              ? 'bg-dark-800 text-accent border-t border-x border-white/5' 
              : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            📋 LISTADO
          </button>
          <button 
            onClick={() => setActiveTab('calendario')}
            className={`flex-1 py-3 text-sm font-bold rounded-t-2xl transition-all ${
              activeTab === 'calendario' 
              ? 'bg-dark-800 text-accent border-t border-x border-white/5' 
              : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            📅 CALENDARIO
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {errorMsg && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl flex justify-between items-center">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)}>✕</button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-20 opacity-50">Cargando registros...</div>
          ) : activeTab === 'lista' ? (
            <div className="space-y-4">
              {historialFiltrado.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <div className="text-6xl mb-4">📭</div>
                  <p>No hay ventas nuevas en el listado</p>
                  <p className="text-[10px] mt-2 text-gray-500">Consulta el calendario para ver el histórico completo</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-start">
                    <button 
                      onClick={() => setShowConfirm(true)}
                      className="px-6 py-3 mb-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
                    >
                      🔄 Reiniciar ($)
                    </button>
                  </div>
                  {historialFiltrado.map((entry) => (
                    <div key={entry.id} className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-500 uppercase">Mesa {entry.mesa_numero}</span>
                          <span className="text-xs text-gray-400">{new Date(entry.cerrado_at).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-accent font-black text-lg">${entry.total.toLocaleString('es-AR')}</span>
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{entry.metodo_pago}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {(() => {
                          try {
                            const detalleObj = typeof entry.detalle === 'string' ? JSON.parse(entry.detalle) : entry.detalle;
                            const items = detalleObj?.items || [];
                            return items.map((item, idx) => (
                              <div key={idx} className="border-b border-white/5 last:border-0 pb-1 mb-1">
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>x{item.cantidad} {item.nombre || item.producto_nombre}</span>
                                  <span>${Number(item.subtotal).toLocaleString('es-AR')}</span>
                                </div>
                                {item.notas && (
                                  <p className="text-[9px] text-gray-500 italic">↳ {item.notas}</p>
                                )}
                              </div>
                            ));
                          } catch (e) {
                            return <div className="text-red-500 text-xs">Error cargando detalle</div>;
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <Calendar 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate}
              statsByDate={statsByDate}
            />
          )}

          {/* Modal de Confirmación Custom */}
          {showConfirm && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-dark-900/80 backdrop-blur-md rounded-l-2xl animate-in fade-in duration-200">
              <div className="bg-dark-800 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6">
                <div className="text-5xl">🔄</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black">¿Cerrar Turno Actual?</h3>
                  <p className="text-sm text-gray-400">Las ventas actuales se archivarán. Seguirán siendo visibles en el calendario, pero el listado empezará de cero.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleReiniciarHistorial}
                    className="w-full py-4 bg-accent hover:bg-accent-dark text-dark-900 font-black rounded-2xl transition-all shadow-lg shadow-accent/20"
                  >
                    SÍ, REINICIAR LISTADO
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-2xl transition-all"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-dark-900/50 border-t border-white/5">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-gray-400">TOTAL {activeTab === 'lista' ? 'DEL TURNO' : 'DEL MES'}</span>
            <span className="text-2xl font-black text-accent">
              ${(activeTab === 'lista' 
                ? historialFiltrado.reduce((acc, h) => acc + h.total, 0)
                : Object.entries(statsByDate)
                    .filter(([date]) => date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`))
                    .reduce((acc, [, stats]) => acc + stats.total, 0)
              ).toLocaleString('es-AR')}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
          >
            CERRAR PANEL
          </button>
        </div>
      </div>
    </div>
  );
}

function Calendar({ currentDate, setCurrentDate, statsByDate }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Obtener primer día del mes y cantidad de días
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  if (selectedDay) {
    const dayStats = statsByDate[selectedDay];
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedDay(null)}
            className="flex items-center gap-2 text-xs font-bold text-accent hover:bg-accent/10 px-3 py-2 rounded-xl transition-all"
          >
            ← VOLVER AL MES
          </button>
          <div className="text-right">
            <span className="block text-xs font-bold text-gray-500 uppercase">Detalle del día</span>
            <span className="text-sm font-black text-white">{new Date(selectedDay).toLocaleDateString('es-AR', { dateStyle: 'long' })}</span>
          </div>
        </div>

        <div className="space-y-3">
          {dayStats?.entries.map((entry) => (
            <div key={entry.id} className="glass-card p-4 rounded-2xl border border-white/5 flex justify-between items-center">
              <div>
                <span className="block text-[10px] font-bold text-gray-500 uppercase">Mesa {entry.mesa_numero}</span>
                <span className="text-[10px] text-gray-400">{new Date(entry.cerrado_at).toLocaleTimeString('es-AR')}</span>
              </div>
              <div className="text-right">
                <span className="block text-accent font-black text-sm">${entry.total.toLocaleString('es-AR')}</span>
                <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">{entry.metodo_pago}</span>
              </div>
            </div>
          ))}
          {!dayStats && (
            <div className="text-center py-10 opacity-30">No hay registros para este día</div>
          )}
        </div>

        {dayStats && (
          <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Diario</span>
            <span className="text-xl font-black text-accent">${dayStats.total.toLocaleString('es-AR')}</span>
          </div>
        )}
      </div>
    );
  }

  const days = [];
  // Espacios vacíos para el inicio del mes
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 opacity-0" />);
  }

  // Días del mes
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayStats = statsByDate[dateStr];
    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    days.push(
      <button 
        key={d} 
        onClick={() => setSelectedDay(dateStr)}
        className={`h-24 border border-white/5 p-2 flex flex-col justify-between transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-95 group text-left ${
          isToday ? 'bg-accent/5 border-accent/20' : ''
        }`}
      >
        <span className={`text-xs font-bold ${isToday ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'}`}>{d}</span>
        {dayStats && (
          <div className="text-right">
            <div className="text-[10px] font-black text-accent truncate">
              ${dayStats.total.toLocaleString('es-AR')}
            </div>
            <div className="text-[8px] text-gray-500 font-bold">
              {dayStats.count} ventas
            </div>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Selector de Mes */}
      <div className="flex items-center justify-between bg-dark-900/30 p-2 rounded-xl border border-white/5">
        <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors">◀</button>
        <h3 className="font-black text-sm uppercase tracking-widest text-gray-300">
          {monthNames[month]} {year}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors">▶</button>
      </div>

      {/* Grid del Calendario */}
      <div className="grid grid-cols-7 text-center">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 text-[10px] font-black text-gray-600 uppercase border-b border-white/5">
            {day}
          </div>
        ))}
        {days}
      </div>

      {/* Resumen del Mes */}
      <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Recaudación del mes</span>
          <span className="text-lg font-black text-accent">
            ${Object.entries(statsByDate)
              .filter(([date]) => date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
              .reduce((acc, [, stats]) => acc + stats.total, 0)
              .toLocaleString('es-AR')}
          </span>
        </div>
      </div>
    </div>
  );
}
