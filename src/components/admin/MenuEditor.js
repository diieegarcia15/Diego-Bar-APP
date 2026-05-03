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

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ 
    title: '', 
    message: '', 
    onAction: null, 
    type: 'delete' 
  });

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
      console.error(err);
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
      alert('Error al guardar');
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      title: 'Eliminar Producto?',
      message: 'Esta accion borrara el producto permanentemente.',
      type: 'delete',
      onAction: async () => {
        try {
          await api.eliminarProducto(id);
          loadData();
        } catch (err) {
          alert('Error al eliminar');
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
      alert('Error al crear categoria');
    }
  };

  const handleDeleteCategory = (id, nombre) => {
    setConfirmConfig({
      title: 'Eliminar Categoria?',
      message: 'Se borraran los productos de esta categoria.',
      type: 'warning',
      onAction: async () => {
        try {
          await api.eliminarCategoria(id);
          loadData();
        } catch (err) {
          alert('Error');
        }
      }
    });
    setShowConfirm(true);
  };

  if (isLoading) return <div className="text-center p-10 opacity-50 font-black">CARGANDO MENU...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">GESTION DE MENU</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Administrar productos y categorias</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all text-xs"
          >
            CATEGORIAS
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-accent text-dark-900 px-6 py-3 rounded-xl font-bold hover:shadow-glow-green transition-all text-xs"
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
                      <p className="text-accent font-black text-lg">${p.precio.toLocaleString('es-AR')}</p>
                      
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(p)} className="flex-1 bg-white/5 hover:bg-white/10 py-1.5 rounded-lg text-[9px] font-black">EDITAR</button>
                        <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-1.5 rounded-lg text-[9px] font-black">BORRAR</button>
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
          <div className="relative glass-card bg-dark-800 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden animate-slide-up shadow-2xl p-6 space-y-4">
            <h2 className="text-2xl font-black">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input required type="text" placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 outline-none focus:border-accent" />
              <div className="flex gap-4">
                <input required type="number" placeholder="Precio" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="flex-1 bg-dark-900 border border-white/10 rounded-xl p-4 outline-none focus:border-accent" />
                <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})} className="flex-1 bg-dark-900 border border-white/10 rounded-xl p-4 outline-none focus:border-accent">
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <input type="text" placeholder="URL Imagen" value={formData.imagen_url} onChange={e => setFormData({...formData, imagen_url: e.target.value})} className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 outline-none focus:border-accent" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 py-4 rounded-2xl font-black">CANCELAR</button>
                <button type="submit" className="flex-1 bg-accent text-dark-900 py-4 rounded-2xl font-black">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)}></div>
          <div className="relative glass-card bg-dark-800 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 animate-slide-up space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">CATEGORIAS</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 font-bold">X</button>
            </div>
            <div className="space-y-3">
              {categorias.map(cat => (
                <div key={cat.id} className="flex justify-between items-center bg-dark-900/50 p-4 rounded-2xl border border-white/5">
                  <span className="font-bold text-white uppercase">{cat.nombre}</span>
                  <button onClick={() => handleDeleteCategory(cat.id, cat.nombre)} className="text-red-500 text-xs font-black">BORRAR</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input type="text" placeholder="Nueva..." value={categoryName} onChange={e => setCategoryName(e.target.value)} className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 outline-none" />
              <button type="submit" className="bg-accent text-dark-900 px-4 py-3 rounded-xl font-black">OK</button>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={showConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} onClose={() => setShowConfirm(false)} onConfirm={confirmConfig.onAction} />
    </div>
  );
}
