'use client';
import { io } from 'socket.io-client';

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}
