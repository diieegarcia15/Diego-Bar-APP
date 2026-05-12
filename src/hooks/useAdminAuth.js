'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * useAdminAuth
 * Encapsula toda la lógica de autenticación del panel de administración.
 *
 * Responsabilidades:
 *  - Verificar sesión activa via cookie HttpOnly al montar el componente.
 *  - Exponer login y logout.
 *  - Mantener el estado isLoggedIn y los campos del formulario.
 *
 * @returns {{ isLoggedIn, loginData, setLoginData, handleLogin, handleLogout }}
 */
export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ usuario: '', password: '' });

  // Al montar: verificar si ya existe una sesión activa via cookie HttpOnly.
  // No lee localStorage — el token vive solo en la cookie del servidor.
  useEffect(() => {
    api.verifyToken()
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // El backend setea la cookie HttpOnly — no necesitamos guardar nada aquí.
      await api.login(loginData);
      setIsLoggedIn(true);
    } catch (err) {
      alert('Error de acceso: credenciales incorrectas');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout(); // Limpia la cookie HttpOnly en el servidor
    } catch (_) {}
    setIsLoggedIn(false);
  };

  return { isLoggedIn, loginData, setLoginData, handleLogin, handleLogout };
}
