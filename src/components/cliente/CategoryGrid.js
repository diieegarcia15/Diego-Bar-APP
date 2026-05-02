'use client';
import IconRenderer from '../shared/IconRenderer';

export default function CategoryGrid({ categories, onSelect }) {
  return (
    <div className="p-4 animate-fade-in max-w-4xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center justify-center aspect-square glass-card rounded-3xl group active:scale-95 transition-all duration-300 hover:border-accent/40"
          >
            <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
              <IconRenderer 
                name={cat.icono} 
                size="2.5rem" 
                className="!bg-none !shadow-none !p-0"
                noBackground={true}
              />
            </div>
            <span className="text-sm font-black text-white uppercase tracking-wider text-center px-2 leading-tight">
              {cat.nombre}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
