'use client';
import ProductCard from './ProductCard';

// Skeleton de producto mientras carga
function ProductSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full animate-pulse">
      <div className="h-28 md:h-40 loading-shimmer shrink-0" />
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="h-4 loading-shimmer rounded w-3/4" />
        <div className="h-3 loading-shimmer rounded w-1/2" />
        <div className="mt-auto h-8 loading-shimmer rounded-lg" />
      </div>
    </div>
  );
}

export default function MenuGrid({ products, onAdd, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-4 max-w-4xl mx-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center opacity-30">
        <p className="text-lg font-bold italic">No hay productos en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-4 animate-fade-in max-w-4xl mx-auto">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onAdd={onAdd} 
        />
      ))}
    </div>
  );
}
