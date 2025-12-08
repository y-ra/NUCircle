import { useEffect, useState } from 'react';
import { getSocket } from './useSocket';
import { NotificationPayload } from '../types/types';

// for when multiple notifications
export interface NotificationItem extends NotificationPayload {
  id: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Hook to manage notifications
const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    /**
     * Handles incoming notifications from the server
     * @param payload - The notification payload received from the server
     */
    const handleNotification = (payload: NotificationPayload) => {
      const newNotification: NotificationItem = { ...payload, id: generateId() };
      setNotifications(prev => [...prev, newNotification]);

      // remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, []);

  return { notifications };
};

export default useNotifications;
