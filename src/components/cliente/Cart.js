'use client';
import { useState } from 'react';

export default function Cart({ items, onUpdateQty, onRemove, onCheckout, isOpen, onClose }) {
  const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const tax = subtotal * 0.05; // 5% TAX
  const total = subtotal + tax;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative glass-card rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <span className="mr-2">🛒</span> Tu Pedido
          </h2>
          <button onClick={onClose} className="p-2 bg-dark-700 rounded-full">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">
              El carrito está vacío
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex gap-4 items-center bg-dark-800/50 p-3 rounded-2xl border border-white/5">
                <img src={item.imagen_url} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold">{item.nombre}</h4>
                  {item.notas && (
                    <p className="text-[10px] text-gray-400 font-medium italic mt-0.5 line-clamp-1">
                      {item.notas}
                    </p>
                  )}
                  <p className="text-accent font-bold">${item.precio.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-3 bg-dark-900 rounded-xl p-1 px-3">
                  <button onClick={() => onUpdateQty(item.id, item.cantidad - 1, item.notas)} className="text-gray-400">-</button>
                  <span className="font-bold min-w-[20px] text-center">{item.cantidad}</span>
                  <button onClick={() => onUpdateQty(item.id, item.cantidad + 1, item.notas)} className="text-accent">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-dark-800/80 space-y-4 rounded-t-3xl border-t border-white/10">
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuestos (5%)</span>
              <span>${tax.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-white/5">
              <span>Total</span>
              <span className="text-accent">${total.toLocaleString('es-AR')}</span>
            </div>
          </div>
          <button
            disabled={items.length === 0}
            onClick={onCheckout}
            className="w-full py-4 bg-accent hover:bg-accent-dark text-dark-900 font-bold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:grayscale"
          >
            CONFIRMAR PEDIDO
          </button>
        </div>
      </div>
    </div>
  );
}
