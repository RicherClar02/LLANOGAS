//src/components/NotificationBadge.tsx
'use client';

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBadge() {
  const { unreadCount, loadNotifications } = useNotifications();

  const handleClick = () => {
    // Navegar a la página de notificaciones
    window.location.href = '/dashboard/notificaciones';
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      title={`${unreadCount} notificaciones no leídas`}
    >
      <Bell size={20} />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}