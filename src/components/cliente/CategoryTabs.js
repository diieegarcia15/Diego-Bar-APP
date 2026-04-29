import IconRenderer from '../shared/IconRenderer';

export default function CategoryTabs({ categories, activeId, onSelect }) {
  return (
    <div className="sticky top-0 bg-dark-900/95 backdrop-blur-xl z-20 border-b border-white/5">
      {/* Mobile Grid Layout (Compact) */}
      <div className="grid grid-cols-5 gap-y-4 gap-x-2 p-4 md:flex md:overflow-x-auto md:py-6 md:gap-4 md:px-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex flex-col items-center gap-1 group transition-all duration-300 ${
              activeId === cat.id ? 'scale-105' : 'opacity-50 hover:opacity-100'
            }`}
          >
            <IconRenderer 
              name={cat.icono} 
              size={20} 
              className={`transition-all duration-300 ${
                activeId === cat.id 
                  ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-2 ring-white/10' 
                  : ''
              }`}
            />
            <span className={`text-[12px] md:text-sm font-bold uppercase tracking-tight text-center leading-tight transition-colors line-clamp-2 px-1 ${
              activeId === cat.id ? 'text-accent' : 'text-gray-500'
            }`}>
              {cat.nombre}
            </span>
            
            {/* Active Indicator */}
            {activeId === cat.id && (
              <div className="w-1 h-1 bg-accent rounded-full mt-0.5"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
