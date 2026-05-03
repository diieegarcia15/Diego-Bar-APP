'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-[family-name:var(--font-pt-sans-narrow)] uppercase">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-3xl font-bold text-white">Restaurante QR</h1>
        <p className="text-gray-400">Sistema de pedidos en tiempo real</p>
        
        <div className="space-y-3 pt-4">
          <button
            onClick={() => router.push('/mesa/1')}
            className="w-full py-3 px-6 bg-accent hover:bg-accent-dark text-dark-900 font-semibold rounded-xl transition-all duration-200 hover:shadow-glow-green"
          >
            Ver Menu (Mesa Demo)
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="w-full py-3 px-6 bg-dark-600 hover:bg-dark-500 text-white font-semibold rounded-xl border border-dark-400 transition-all duration-200"
          >
            Panel de Administracion
          </button>
        </div>

        <p className="text-xs text-gray-500 pt-4">
          Escanea el QR de tu mesa para comenzar a pedir
        </p>
      </div>
    </div>
  );
}
