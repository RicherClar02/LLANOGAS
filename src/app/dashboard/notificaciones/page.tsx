// src/app/dashboard/notificaciones/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, AlertTriangle, Info, CheckCircle, Filter, Search, RefreshCw } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  casoId?: string;
  userId?: string;
  source?: 'system' | 'email';
  emailId?: string;
}

export default function NotificacionesPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'no-leidos'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());

  // Función para cargar notificaciones
  const cargarNotificaciones = useCallback(async (showLoading = true) => {
    if (!session) return;
    
    try {
      if (showLoading && notifications.length === 0) {
        setLoading(true);
      }
      setRefreshing(true);
      setError(null);
      
      // Agregar timestamp para evitar caché
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/notifications?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const data = await response.json();
      console.log('Notificaciones cargadas:', data.notifications);
      
      if (data.success && data.notifications) {
        const notificacionesConFecha = data.notifications.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        
        setNotifications(notificacionesConFecha);
        setUltimaActualizacion(new Date());
        
        if (data.metadata?.emailsNuevos > 0) {
          console.log(`Hay ${data.metadata.emailsNuevos} emails nuevos`);
        }
      } else {
        throw new Error('Estructura de respuesta inválida');
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, notifications.length]);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  // Configurar polling automático (cada 30 segundos)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarNotificaciones(false);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [cargarNotificaciones]);

  // Escuchar eventos de notificación
  useEffect(() => {
    const handleNuevaNotificacion = () => {
      cargarNotificaciones(false);
    };

    window.addEventListener('nueva-notificacion', handleNuevaNotificacion);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cargarNotificaciones(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('nueva-notificacion', handleNuevaNotificacion);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cargarNotificaciones]);

  const marcarComoLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(notifications.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        ));
      } else {
        console.error('Error marcando notificación como leída');
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      // Actualizar UI localmente aunque falle el API
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const promesas = notifications
        .filter(notif => !notif.read)
        .map(notif => 
          fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' })
        );

      await Promise.all(promesas);
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      
      // Disparar evento para actualizar badge
      window.dispatchEvent(new CustomEvent('notificaciones-leidas'));
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      // Actualizar UI localmente
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const notificacionesFiltradas = notifications.filter(notif => {
    const coincideBusqueda = 
      notif.title.toLowerCase().includes(busqueda.toLowerCase()) ||
      notif.message.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideFiltro = 
      filtro === 'todos' || 
      (filtro === 'no-leidos' && !notif.read);
    
    return coincideBusqueda && coincideFiltro;
  });

  const noLeidasCount = notifications.filter(n => !n.read).length;

  // Función para navegar al caso
  const irAlCaso = (casoId: string) => {
    if (casoId) {
      window.location.href = `/dashboard/bandeja/${casoId}`;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600">
            {noLeidasCount} {noLeidasCount === 1 ? 'no leída' : 'no leídas'} de {notifications.length} total
          </p>
          <p className="text-sm text-gray-500">
            Última actualización: {ultimaActualizacion.toLocaleTimeString('es-ES')}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => cargarNotificaciones(false)}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} size={18} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          
          {noLeidasCount > 0 && (
            <button
              onClick={marcarTodasComoLeidas}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-500 mr-2" size={20} />
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar en notificaciones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {/* Filtro */}
          <div>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as 'todos' | 'no-leidos')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="todos">Todas las notificaciones</option>
              <option value="no-leidos">Solo no leídas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {notificacionesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {busqueda ? 'No se encontraron notificaciones' : 'No hay notificaciones'}
            </h3>
            <p className="text-gray-600">
              {busqueda ? 'Intenta con otros términos de búsqueda' : 'Todas las notificaciones están al día'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notificacionesFiltradas.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 border-l-4 ${getTypeColor(notification.type)} ${
                  !notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                } transition-colors cursor-pointer`}
                onClick={() => notification.casoId && irAlCaso(notification.casoId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLeida(notification.id);
                            }}
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Check size={16} />
                            <span>Marcar como leída</span>
                          </button>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500">
                        <span>
                          {notification.timestamp.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {notification.casoId && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            Caso: {notification.casoId}
                          </span>
                        )}
                        
                        {notification.source === 'email' && (
                          <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-xs">
                            📧 Correo
                          </span>
                        )}
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notification.type === 'success' ? 'bg-green-100 text-green-800' :
                          notification.type === 'error' ? 'bg-red-100 text-red-800' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.type === 'success' ? 'Éxito' : 
                           notification.type === 'error' ? 'Error' : 
                           notification.type === 'warning' ? 'Advertencia' : 'Información'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}