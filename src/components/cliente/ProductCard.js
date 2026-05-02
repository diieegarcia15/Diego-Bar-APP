'use client';
import { useState } from 'react';

export default function ProductCard({ product, onAdd }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="glass-card rounded-xl overflow-hidden group hover:shadow-card-hover transition-all duration-300 flex flex-col h-full">
      <div className="relative h-28 md:h-40 overflow-hidden shrink-0 bg-dark-800">
        {/* Skeleton shimmer mientras carga */}
        {!imgLoaded && (
          <div className="absolute inset-0 loading-shimmer" />
        )}
        <img
          src={product.imagen_url || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop'}
          alt={product.nombre}
          loading="eager"
          decoding="async"
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop';
            setImgLoaded(true);
          }}
        />
        <div className="absolute top-1 right-1 bg-dark-900/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
          <span className="text-accent font-black text-xs md:text-sm">${product.precio.toLocaleString('es-AR')}</span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3 className="font-black text-white text-sm md:text-xl leading-tight line-clamp-2 uppercase">{product.nombre}</h3>
          <p className="text-gray-400 text-[11px] md:text-base line-clamp-2 leading-tight h-8 md:h-12">{product.descripcion}</p>
        </div>
        <button
          onClick={() => onAdd(product)}
          className="w-full py-1.5 md:py-2 bg-dark-600 hover:bg-accent hover:text-dark-900 text-accent font-black rounded-lg transition-all duration-300 border border-accent/20 hover:border-accent text-[10px] md:text-sm uppercase tracking-widest"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
