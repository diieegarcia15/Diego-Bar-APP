const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers = { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Envía la cookie HttpOnly automáticamente en cada request
  });
  if (!res.ok) {
    const text = await res.text();
    let err;
    try {
      err = JSON.parse(text);
    } catch (e) {
      err = { error: text || `Error HTTP ${res.status}` };
    }
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCategorias: () => fetchAPI('/api/categorias'),
  crearCategoria: (data) => fetchAPI('/api/categorias', { method: 'POST', body: JSON.stringify(data) }),
  actualizarCategoria: (id, data) => fetchAPI(`/api/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarCategoria: (id) => fetchAPI(`/api/categorias/${id}`, { method: 'DELETE' }),
  getProductos: (catId) => fetchAPI(`/api/productos${catId ? `?categoria_id=${catId}` : ''}`),
  getMesas: () => fetchAPI('/api/mesas'),
  getMesa: (id) => fetchAPI(`/api/mesas/${id}`),
  crearMesa: (data) => fetchAPI('/api/mesas', { method: 'POST', body: JSON.stringify(data) }),
  eliminarMesa: (id) => fetchAPI(`/api/mesas/${id}`, { method: 'DELETE' }),
  getPedidos: () => fetchAPI('/api/pedidos'),
  crearPedido: (data) => fetchAPI('/api/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarPedido: (id, data) => fetchAPI(`/api/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  actualizarMesa: (id, data) => fetchAPI(`/api/mesas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  cerrarMesa: (id, data) => fetchAPI(`/api/mesas/${id}/cerrar`, { method: 'POST', body: JSON.stringify(data) }),
  getHistorial: () => fetchAPI('/api/historial'),
  reiniciarHistorial: () => fetchAPI('/api/historial/reiniciar', { method: 'POST', body: JSON.stringify({}) }),
  eliminarTodoHistorial: () => fetchAPI('/api/historial', { method: 'DELETE' }),
  login: (data) => fetchAPI('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyToken: () => fetchAPI('/api/auth/verify'),
  logout: () => fetchAPI('/api/auth/logout', { method: 'POST' }),
  crearProducto: (data) => fetchAPI('/api/productos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarProductoAdmin: (id, data) => fetchAPI(`/api/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarProducto: (id) => fetchAPI(`/api/productos/${id}`, { method: 'DELETE' }),
  getSectores: () => fetchAPI('/api/sectores'),
  crearSector: (data) => fetchAPI('/api/sectores', { method: 'POST', body: JSON.stringify(data) }),
  actualizarSector: (id, data) => fetchAPI(`/api/sectores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarSector: (id) => fetchAPI(`/api/sectores/${id}`, { method: 'DELETE' }),
};
