// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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
    // Nota: La acción onClick debería idealmente evitar funciones de UI en un hook, 
    // pero la mantendremos para coherencia con el original.
    onClick: () => void; 
  };
}

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Cargar notificaciones del usuario
  const loadNotifications = useCallback(async (forceReload = false) => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      // Agregar timestamp para evitar caché
      const timestamp = forceReload ? `?t=${Date.now()}` : '';
      const response = await fetch(`/api/notifications${timestamp}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // 🟢 CORRECCIÓN 1: Verificar 'data.success' si tu API lo envía
        // Si tu API no envía 'success', puedes quitar este if (data.success)
        // Pero si sí lo envía, es una buena validación. Usaremos solo la presencia de 'data.notifications'.
        if (data && Array.isArray(data.notifications)) { 
          const formattedNotifications = data.notifications.map((notif: any) => ({
            ...notif,
            // Convertir la cadena de fecha a objeto Date
            timestamp: new Date(notif.timestamp)
          }));
          setNotifications(formattedNotifications);
          setLastUpdate(new Date());
        }
      } else {
        console.error('Error en respuesta del servidor:', response.status);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // 🟢 CORRECCIÓN 2: Usar PUT al endpoint base con JSON body
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: notificationId, action: 'read' }) // Asumiendo que 'action: read' es necesario
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

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      // 🟢 CORRECCIÓN 3: Usar una sola petición PUT a un endpoint específico para "todas"
      // Esto es mucho más eficiente que un Promise.all de peticiones individuales.
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      } else {
        console.error('Fallo al marcar todas como leídas:', response.status);
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
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
        // Recargar notificaciones para obtener el nuevo ítem
        await loadNotifications(true);
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

  // Configurar polling automático y eventos
  useEffect(() => {
    if (!session?.user?.id) {
        setLoading(false); // Asegurar que loading se desactive si no hay sesión
        return;
    }

    // Carga inicial
    loadNotifications();

    // Configurar intervalo para actualizar cada 30 segundos
    const intervalId = setInterval(() => {
      // Solo actualizar si la pestaña está visible
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    }, 30000); // 30 segundos

    // Escuchar eventos de visibilidad (para recargar al volver a la pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Escuchar eventos de notificación personalizados (ej. push/websocket event simulado)
    const handleNewNotification = () => {
      loadNotifications(true); // Forzar recarga completa
    };

    window.addEventListener('nueva-notificacion', handleNewNotification);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('nueva-notificacion', handleNewNotification);
    };
  }, [session, loadNotifications]); // Dependencias: session y loadNotifications

  return {
    notifications,
    loading,
    lastUpdate,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    notifyCaseDue,
    notifyStatusChange,
    unreadCount: notifications.filter(n => !n.read).length
  };
}