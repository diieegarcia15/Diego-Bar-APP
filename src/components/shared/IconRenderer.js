'use client';
import * as LucideIcons from 'lucide-react';

export default function IconRenderer({ name, className = "", size = 20, color = null }) {
  const IconComponent = LucideIcons[name] || LucideIcons.Utensils;
  
  // Mapeo de colores premium por tipo de icono
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
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} p-2 shadow-lg shadow-black/20 ${className}`} style={{ width: size + 16, height: size + 16 }}>
      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradientClass} blur-md opacity-40 group-hover:opacity-70 transition-opacity`}></div>
      
      <IconComponent 
        size={size} 
        className="text-white relative z-10 filter drop-shadow-md" 
        strokeWidth={2.5}
      />
    </div>
  );
}
