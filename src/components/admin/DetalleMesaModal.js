'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function DetalleMesaModal({ mesaId, isOpen, onClose, onCerrarMesa }) {
  const [mesa, setMesa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && mesaId) {
      setIsLoading(true);
      api.getMesa(mesaId)
        .then(data => {
          setMesa(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [isOpen, mesaId]);

  if (!isOpen) return null;

  const pedidos = mesa?.pedidos || [];
  const totalPedidos = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
  const tax = totalPedidos * 0.05;
  const total = totalPedidos + tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative glass-card rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-800/80 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              🪑 Detalle Mesa {mesa?.numero}
            </h2>
            {mesa?.estado === 'por_cobrar' && (
              <span className="text-yellow-500 font-bold text-sm flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                El cliente ha solicitado la cuenta
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-dark-700 rounded-full w-10 h-10 flex items-center justify-center hover:bg-dark-600">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-10 text-gray-400">Cargando detalles...</div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">No hay pedidos para esta mesa.</div>
          ) : (
            pedidos.map(pedido => (
              <div key={pedido.id} className="bg-dark-900/50 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-sm text-gray-400">
                    Pedido #{pedido.id} - {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm font-bold bg-dark-600 px-2 py-1 rounded-lg">
                    {pedido.estado.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2">
                  {pedido.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{item.cantidad}x</span>
                        <span>{item.nombre}</span>
                      </div>
                      <span className="text-gray-300">${Number(item.subtotal).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-dark-800/80 rounded-b-3xl border-t border-white/10 space-y-4">
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal Pedidos</span>
              <span>${totalPedidos.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuestos (5%)</span>
              <span>${tax.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-white text-2xl font-bold pt-2 border-t border-white/5">
              <span>Total a Cobrar</span>
              <span className="text-accent">${total.toLocaleString('es-AR')}</span>
            </div>
          </div>
          <button
            onClick={async () => {
              const success = await onCerrarMesa(mesa.id);
              if (success) {
                onClose();
              }
            }}
            disabled={isLoading}
            className="w-full py-4 bg-accent hover:bg-accent-dark text-dark-900 font-bold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-2"
          >
            <span>💰</span> CERRAR MESA Y COBRAR
          </button>
        </div>
      </div>
    </div>
  );
}
