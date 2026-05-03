'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import IconRenderer from '../shared/IconRenderer';
import ConfirmModal from '../shared/ConfirmModal';

export default function MenuEditor() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('Utensils');

  // Estados para el Modal de Confirmaci\u00f3n personalizado
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ 
    title: '', 
    message: '', 
    onAction: null, 
    type: 'delete' 
  });

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    imagen_url: '',
    categoria_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        api.getProductos(),
        api.getCategorias()
      ]);
      setProductos(prodData);
      setCategorias(catData);
    } catch (err) {
      alert('Error cargando men\u00fa: ' + err.message);
    }
    setIsLoading(false);
  }

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        nombre: prod.nombre,
        descripcion: prod.descripcion || '',
        precio: prod.precio,
        imagen_url: prod.imagen_url || '',
        categoria_id: prod.categoria_id
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        imagen_url: '',
        categoria_id: categorias.length > 0 ? categorias[0].id : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.actualizarProductoAdmin(editingProduct.id, {
          ...formData,
          precio: Number(formData.precio),
          categoria_id: Number(formData.categoria_id)
        });
      } else {
        await api.crearProducto({
          ...formData,
          precio: Number(formData.precio),
          categoria_id: Number(formData.categoria_id)
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Error al guardar producto: ' + err.message);
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: '\u00bfEliminar Producto?',
      message: 'Esta acci\u00f3n eliminar\u00e1 el producto del men\u00fa permanentemente.',
      type: 'delete',
      onAction: async () => {
        try {
          await api.eliminarProducto(id);
          loadData();
        } catch (err) {
          alert('Error al eliminar producto: ' + err.message);
        }
      }
    });
    setShowConfirm(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await api.crearCategoria({ nombre: categoryName, icono: categoryIcon });
      setCategoryName('');
      setCategoryIcon('Utensils');
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteCategory = (id, nombre) => {
    setConfirmConfig({
      title: '\u00bfEliminar Categor\u00eda?',
      message: `\u00bfEst\u00e1s seguro de eliminar "${nombre}"? Se borrar\u00e1n todos los productos asociados a ella.`,
      type: 'warning',
      onAction: async () => {
        try {
          await api.eliminarCategoria(id);
          loadData();
        } catch (err) {
          alert('Error al eliminar categor\u00eda: ' + err.message);
        }
      }
    });
    setShowConfirm(true);
  };

  if (isLoading) return <div className="text-center p-10 opacity-50 font-black tracking-widest">CARGANDO MEN\u00da...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">GESTI\u00d3N DE MEN\u00da</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Administrar productos y categor\u00edas</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setCategoryName('');
              setIsCategoryModalOpen(true);
            }}
            className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all text-sm"
          >
            \u270f\ufe0f CATEGOR\u00cdAS
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-accent text-dark-900 px-6 py-3 rounded-xl font-bold hover:shadow-glow-green transition-all text-sm"
          >
            + NUEVO PRODUCTO
          </button>
        </div>
      </div>

      <div className="space-y-12 pb-20">
        {categorias.map(cat => {
          const catProds = productos.filter(p => p.categoria_id === cat.id);
          if (catProds.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                  <IconRenderer name={cat.icono} size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">{cat.nombre}</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{catProds.length} productos</p>
                </div>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {catProds.map(p => (
                  <div key={p.id} className="glass-card p-4 rounded-2xl flex gap-4 group hover:border-accent/30 transition-all">
                    <img 
                      src={p.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'} 
                      alt={p.nombre} 
                      className="w-20 h-20 object-cover rounded-xl shadow-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-tight text-white truncate">{p.nombre}</h3>
                      <p className="text-gray-500 text-[10px] line-clamp-1 mb-1">{p.descripcion}</p>
                      <p className="text-accent font-black text-lg">${p.precio.toLocaleString('es-AR')}</p>
                      
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(p)}
                          className="flex-1 bg-white/5 hover:bg-white/10 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          EDITAR
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          ELIMINAR
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative glass-card bg-dark-800 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden animate-slide-up shadow-2xl">
            <div className="p-6 border-b border-white/5 bg-dark-900/50">
              <h2 className="text-2xl font-black">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nombre del Producto *</label>
                <input 
                  required
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 focus:border-accent outline-none text-sm transition-all"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Precio *</label>
                  <input 
                    required
                    type="number" 
                    value={formData.precio}
                    onChange={e => setFormData({...formData, precio: e.target.value})}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 focus:border-accent outline-none text-sm transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Categor\u00eda *</label>
                  <select 
                    required
                    value={formData.categoria_id}
                    onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 focus:border-accent outline-none text-sm transition-all appearance-none"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Descripci\u00f3n</label>
                <textarea 
                  rows="2"
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 focus:border-accent outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Imagen del Producto</label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={formData.imagen_url}
                      onChange={e => setFormData({...formData, imagen_url: e.target.value})}
                      className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 focus:border-accent outline-none text-sm transition-all placeholder:text-gray-700 pr-24"
                      placeholder="https://... o sube una foto"
                    />
                    <label className="absolute right-2 top-2 bottom-2">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          
                          const formDataUpload = new FormData();
                          formDataUpload.append('image', file);
                          
                          try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/upload`, {
                              method: 'POST',
                              body: formDataUpload
                            });
                            const data = await res.json();
                            if (data.imageUrl) {
                              setFormData(prev => ({ ...prev, imagen_url: data.imageUrl }));
                            }
                          } catch (err) {
                            alert('Error al subir imagen: ' + err.message);
                          }
                        }}
                      />
                      <div className="h-full px-3 bg-accent text-dark-900 rounded-lg flex items-center justify-center font-black text-[10px] cursor-pointer hover:bg-white transition-all uppercase tracking-tighter">
                        Subir Foto
                      </div>
                    </label>
                  </div>
                  <div className="w-14 h-14 bg-dark-900 border border-white/10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg">
                    {formData.imagen_url ? (
                      <img src={formData.imagen_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Error'} />
                    ) : (
                      <span className="text-gray-700 text-[10px] font-black">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-accent text-dark-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-glow-green transition-all"
                >
                  {editingProduct ? 'ACTUALIZAR' : 'CREAR PRODUCTO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="relative glass-card bg-dark-800 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden animate-slide-up shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-white/5 bg-dark-900/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Categor\u00edas</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Organiza tu men\u00fa</p>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white transition-all hover:bg-white/10 active:scale-95">
                <IconRenderer name="X" size={18} noBackground />
              </button>
            </div>
            
            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              {/* Nueva Categor\u00eda */}
              <form onSubmit={handleAddCategory} className="space-y-3">
                <div className="flex gap-2">
                  <select 
                    value={categoryIcon}
                    onChange={e => setCategoryIcon(e.target.value)}
                    className="w-16 bg-dark-900 border border-white/10 rounded-xl px-2 py-3 outline-none focus:border-accent appearance-none text-center font-bold text-lg"
                  >
                    <option value="Utensils">\ud83c\udf74</option>
                    <option value="Soup">\ud83c\udf5c</option>
                    <option value="Leaf">\ud83e\udd57</option>
                    <option value="Beef">\ud83e\udd69</option>
                    <option value="Pizza">\ud83c\udf55</option>
                    <option value="Coffee">\u2615</option>
                    <option value="GlassWater">\ud83e\udd64</option>
                    <option value="IceCream">\ud83c\udf66</option>
                    <option value="CakeSlice">\ud83c\udf70</option>
                    <option value="Beer">\ud83c\udf7a</option>
                    <option value="Martini">\ud83c\udf78</option>
                    <option value="Wine">\ud83c\udf77</option>
                    <option value="ChefHat">\ud83d\udc68\u200d\ud83c\udf73</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Nueva categor\u00eda..."
                    value={editingCategory === null ? categoryName : ''}
                    onChange={e => setCategoryName(e.target.value)}
                    className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm focus:border-accent transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-accent text-dark-900 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-glow-green transition-all"
                >
                  A\u00f1adir Categor\u00eda
                </button>
              </form>

              <div className="space-y-3 pt-4 border-t border-white/5">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex gap-3 items-center bg-dark-900/50 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-accent">
                      <IconRenderer name={cat.icono} size={20} />
                    </div>
                    
                    {editingCategory === cat.id ? (
                      <div className="flex-1 flex gap-2 animate-in fade-in slide-in-from-left duration-200">
                        <input 
                          type="text" 
                          value={categoryName}
                          onChange={e => setCategoryName(e.target.value)}
                          className="flex-1 bg-dark-900 border border-accent rounded-lg px-3 py-2 outline-none text-sm"
                          autoFocus
                        />
                        <button 
                          onClick={async () => {
                            try {
                              await api.actualizarCategoria(cat.id, { nombre: categoryName });
                              setEditingCategory(null);
                              loadData();
                            } catch (err) {
                              alert('Error: ' + err.message);
                            }
                          }}
                          className="bg-accent text-dark-900 px-3 py-2 rounded-lg text-xs font-black"
                        >
                          \u2714
                        </button>
                         <button 
                          onClick={() => setEditingCategory(null)}
                          className="bg-white/10 px-3 py-2 rounded-lg text-xs font-black text-gray-400 hover:bg-white/20"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="block font-black text-sm text-white uppercase tracking-tight">{cat.nombre}</span>
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{cat.total_productos || 0} productos</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingCategory(cat.id);
                              setCategoryName(cat.nombre);
                            }}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs text-gray-300"
                            title="Renombrar"
                          >
                            \u270f\ufe0f
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-xs text-red-500"
                            title="Eliminar"
                          >
                            \ud83d\uddd1\ufe0f
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmConfig.onAction}
      />
    </div>
  );
}
