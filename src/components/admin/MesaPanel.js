'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const DEFAULTS = [
  { id: 'd1', nombre: 'Adentro', icono: '🏠' },
  { id: 'd2', nombre: 'Patio', icono: '🌿' },
  { id: 'd3', nombre: 'Deck (Calle)', icono: '🏙️' }
];

export default function MesaPanel({ mesas = [], onMesaClick, onAddMesa, onDeleteMesa }) {
  const [sectores, setSectores] = useState(DEFAULTS);
  const [isEditingSectors, setIsEditingSectors] = useState(false);
  const [newSector, setNewSector] = useState({ nombre: '', icono: '🏠' });
  const mesaList = Array.isArray(mesas) ? mesas : [];

  useEffect(() => { loadSectores(); }, []);

  async function loadSectores() {
    try {
      const data = await api.getSectores();
      if (data && Array.isArray(data) && data.length > 0) {
        setSectores(data);
      } else {
        setSectores(DEFAULTS);
      }
    } catch (err) { 
      console.error('Error cargando sectores:', err);
      setSectores(DEFAULTS);
    }
  }

  const handleAddSector = async () => {
    if (!newSector.nombre) return;
    try {
      await api.crearSector(newSector);
      setNewSector({ nombre: '', icono: '🏠' });
      loadSectores();
    } catch (err) { alert('Error al crear sector'); }
  };

  const libres     = mesaList.filter(m => m.estado === 'disponible').length;
  const ocupadas   = mesaList.filter(m => m.estado === 'ocupada').length;
  const porCobrar  = mesaList.filter(m => m.estado === 'por_cobrar').length;

  return (
    <div className="w-full flex flex-col space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="glass-card bg-dark-800/40 rounded-2xl px-3 py-2 border border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-[10px] font-black text-white">{libres} LIBRES</span>
          </div>
          <div className="glass-card bg-red-500/10 rounded-2xl px-3 py-2 border border-red-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-red-400">{ocupadas} OCUPADAS</span>
          </div>
          <div className="glass-card bg-yellow-500/10 rounded-2xl px-3 py-2 border border-yellow-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-yellow-500">{porCobrar} CUENTA</span>
          </div>
        </div>
        <button 
          onClick={() => setIsEditingSectors(!isEditingSectors)} 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isEditingSectors ? 'bg-white text-dark-900 border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
        >
          {isEditingSectors ? 'LISTO' : 'EDITAR MESAS'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {sectores.map(sector => {
          const sectorMesas = mesaList.filter(m => m.sector === sector.nombre);
          
          return (
            <div key={sector.id} className="flex-1 min-w-[280px] flex flex-col space-y-4">
              <div className="flex items-center justify-between bg-dark-800/30 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{sector.icono}</span>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{sector.nombre}</h3>
                </div>
                <button 
                  onClick={() => onAddMesa(sector.nombre)} 
                  className="w-7 h-7 flex items-center justify-center bg-accent text-dark-900 rounded-lg text-sm font-black hover:scale-105 transition-all"
                >
                  +
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sectorMesas.map(m => (
                  <div key={m.id} className="relative group">
                    <button 
                      onClick={() => m.estado !== 'disponible' ? onMesaClick(m.id) : null} 
                      className={`w-full aspect-square rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center relative ${
                        m.estado === 'disponible' 
                          ? 'bg-dark-700 border-white/20 hover:bg-dark-600' 
                          : m.estado === 'por_cobrar' 
                            ? 'bg-yellow-500/20 border-yellow-500 shadow-glow-yellow' 
                            : 'bg-red-500/20 border-red-500 shadow-glow-red'
                      }`}
                    >
                      <span className="text-lg font-black text-white">{m.numero}</span>
                      <span className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${
                        m.estado === 'por_cobrar' ? 'text-yellow-500' : m.estado === 'ocupada' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {m.estado === 'por_cobrar' ? 'Cuenta' : m.estado === 'ocupada' ? 'Ocupada' : 'Libre'}
                      </span>
                    </button>
                    {isEditingSectors && m.estado === 'disponible' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteMesa(m.id); }} 
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center transition-all z-20 shadow-lg border-2 border-dark-900"
                      >
                        <span className="text-[10px] font-bold">X</span>
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
  );
}
