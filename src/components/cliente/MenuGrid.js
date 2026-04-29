'use client';
import ProductCard from './ProductCard';

export default function MenuGrid({ products, onAdd }) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center opacity-30">
        <p className="text-lg font-bold italic">No hay productos en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 p-3 animate-fade-in">
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
