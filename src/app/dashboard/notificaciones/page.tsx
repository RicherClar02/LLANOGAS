//src/app/dashboard/notificaciones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, AlertTriangle, Info, CheckCircle, Filter, Search } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  casoId?: string;
}

export default function NotificacionesPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'no-leidos'>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        // Simular carga de notificaciones
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'warning',
            title: 'Caso por vencer',
            message: 'El caso SUI-2024-001 vence en 2 días',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            read: false,
            casoId: 'SUI-2024-001'
          },
          {
            id: '2',
            type: 'info',
            title: 'Nuevo comentario',
            message: 'Tienes un nuevo comentario en el caso SS-2024-015',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            read: false,
            casoId: 'SS-2024-015'
          },
          {
            id: '3',
            type: 'success',
            title: 'Caso completado',
            message: 'El caso MME-2024-008 ha sido cerrado exitosamente',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
            read: true,
            casoId: 'MME-2024-008'
          },
          {
            id: '4',
            type: 'error',
            title: 'Plazo vencido',
            message: 'El caso SUI-2024-005 ha vencido',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
            read: true,
            casoId: 'SUI-2024-005'
          }
        ];
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarNotificaciones();
  }, []);

  const marcarComoLeida = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const marcarTodasComoLeidas = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
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

  if (loading) {
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
        </div>

        <div className="flex space-x-3">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro */}
          <div>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as 'todos' | 'no-leidos')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  !notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                } transition-colors`}
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
                            onClick={() => marcarComoLeida(notification.id)}
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
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notification.type === 'success' ? 'bg-green-100 text-green-800' :
                          notification.type === 'error' ? 'bg-red-100 text-red-800' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.type}
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