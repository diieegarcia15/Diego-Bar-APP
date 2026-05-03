'use client';
import { 
  Utensils, Soup, Leaf, ChefHat, Component, 
  GlassWater, IceCream, Beer, Martini, Pizza, 
  Coffee, CakeSlice, Wine, ChevronLeft 
} from 'lucide-react';

const ICONS = {
  Utensils, Soup, Leaf, ChefHat, Component, 
  GlassWater, IceCream, Beer, Martini, Pizza, 
  Coffee, CakeSlice, Wine, ChevronLeft
};

export default function IconRenderer({ name, className = "", size = "1.25rem", color = null, noBackground = false }) {
  // Si el 'name' es una URL (empieza con http o tiene extensi\u00f3n de imagen), renderizamos una imagen
  const isUrl = name && (name.startsWith('http') || name.includes('.png') || name.includes('.svg'));

  if (isUrl) {
    const imgElement = (
      <img 
        src={name} 
        alt="icon" 
        className={`${className} object-contain`} 
        style={{ width: `calc(${size} * 1.5)`, height: `calc(${size} * 1.5)`, filter: 'brightness(0) invert(1)' }} 
      />
    );

    if (noBackground) return imgElement;

    const gradientClass = 'from-gray-700 to-gray-900'; // Fondo neutro para im\u00e1genes externas

    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} p-1 shadow-lg shadow-black/20 ${className}`}
        style={{ width: `calc(${size} + 1rem)`, height: `calc(${size} + 1rem)` }}
      >
        <div className="absolute inset-0 rounded-xl bg-black/20"></div>
        <div className="relative z-10">
          {imgElement}
        </div>
      </div>
    );
  }

  const IconComponent = ICONS[name] || ICONS.Utensils;
  
  if (noBackground) {
    return (
      <IconComponent 
        size={size} 
        className={`text-white ${className}`} 
        strokeWidth={1.5}
      />
    );
  }

  const colorMap = {
    Utensils: 'from-orange-400 to-red-500',
    Soup: 'from-yellow-400 to-orange-500',
    Leaf: 'from-green-400 to-emerald-600',
    ChefHat: 'from-blue-400 to-indigo-600',
    Component: 'from-yellow-200 to-yellow-500',
    GlassWater: 'from-cyan-400 to-blue-500',
    IceCream: 'from-pink-400 to-purple-500',
    Beer: 'from-yellow-500 to-orange-600',
    Martini: 'from-purple-400 to-pink-600',
    Pizza: 'from-red-400 to-orange-500',
    Coffee: 'from-amber-700 to-amber-900',
    CakeSlice: 'from-pink-300 to-rose-500',
    Wine: 'from-red-600 to-rose-900'
  };

  const gradientClass = colorMap[name] || 'from-gray-400 to-gray-600';

  return (
    <div 
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} p-1 shadow-lg shadow-black/20 ${className}`}
      style={{ width: `calc(${size} + 1rem)`, height: `calc(${size} + 1rem)` }}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradientClass} blur-md opacity-40 group-hover:opacity-70 transition-opacity`}></div>
      <IconComponent 
        size={`calc(${size} * 1.5)`} 
        className="text-white relative z-10 filter drop-shadow-md" 
        strokeWidth={1.8}
      />
    </div>
  );
}
