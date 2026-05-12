'use client';
import { io } from 'socket.io-client';
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      reconnectionAttempts: Infinity,
      withCredentials: true, // Enviar cookie de sesión en el handshake de WS
    });
  }
  return socket;
}

/**
 * Registra un callback que se ejecuta automáticamente cada vez que el socket
 * se reconecta tras una pérdida de conexión. Ideal para re-sincronizar el estado.
 * Retorna una función para desregistrar el callback (limpiar en useEffect).
 */
export function onReconnect(callback) {
  const socket = getSocket();
  // 'connect' se dispara tanto en la conexión inicial como en cada reconexción
  socket.on('connect', callback);
  return () => socket.off('connect', callback);
}
