/* eslint-disable no-console */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let socket: Socket | null = null;

export const useSocket = (username: string | null): void => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('[useSocket] Effect running, username:', username);

    // Disconnect if no username
    if (!username) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        socket = null;
      }
      return;
    }

    // Reuse existing global socket if possible
    if (socket && socket.connected) {
      console.log('[useSocket] Reusing existing socket for:', username);
      socketRef.current = socket;
    } else if (!socketRef.current || !socketRef.current.connected) {
      console.log('[useSocket] Creating new socket connection for:', username);
      socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[useSocket] Socket connected:', socket?.id);
        socket?.emit('userConnect', username);
      });

      socket.on('connect_error', error => {
        console.error('[useSocket] Socket connection error:', error);
      });

      socket.on('disconnect', reason => {
        console.log('[useSocket] Socket disconnected:', reason);
      });
    }

    // Cleanup on unmount or username change
    return () => {
      console.log('[useSocket] Cleanup for:', username);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        socket = null;
      }
    };
  }, [username]);
};

export const getSocket = (): Socket | null => {
  return socket;
};
