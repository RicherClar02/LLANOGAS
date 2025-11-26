//src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  casoId?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Cargar notificaciones del usuario
  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }, []);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }, []);

  // Crear nueva notificación
  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (response.ok) {
        // Recargar notificaciones
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error creando notificación:', error);
    }
  }, [loadNotifications]);

  // Notificación para vencimiento de casos
  const notifyCaseDue = useCallback((caso: any, daysUntilDue: number) => {
    const message = daysUntilDue === 0 
      ? `El caso ${caso.id} vence hoy` 
      : `El caso ${caso.id} vence en ${daysUntilDue} días`;

    createNotification({
      type: daysUntilDue <= 1 ? 'error' : 'warning',
      title: 'Caso por vencer',
      message,
      casoId: caso.id,
      action: {
        label: 'Ver caso',
        onClick: () => window.location.href = `/dashboard/bandeja/${caso.id}`
      }
    });
  }, [createNotification]);

  // Notificación para cambio de estado
  const notifyStatusChange = useCallback((caso: any, newStatus: string, user: any) => {
    createNotification({
      type: 'info',
      title: 'Estado actualizado',
      message: `El caso ${caso.id} ha cambiado a "${newStatus}" por ${user.name}`,
      casoId: caso.id,
      action: {
        label: 'Ver caso',
        onClick: () => window.location.href = `/dashboard/bandeja/${caso.id}`
      }
    });
  }, [createNotification]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    loadNotifications,
    markAsRead,
    createNotification,
    notifyCaseDue,
    notifyStatusChange,
    unreadCount: notifications.filter(n => !n.read).length
  };
}