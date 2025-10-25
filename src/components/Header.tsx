// src/components/Header.tsx

'use client';

import { signOut } from 'next-auth/react';
import { User, LogOut, Bell } from 'lucide-react';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    cargo?: string;
    proceso?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page title - se puede hacer dinámico según la ruta */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema de Gestión
          </h1>
          <p className="text-gray-600 text-sm">
            Bienvenido, {user.name}
          </p>
        </div>

        {/* User actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="Notificaciones"
            aria-label="Notificaciones"
          >
            <Bell size={20} />
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900 truncate" title={user.name}>
                {user.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user.role.replace(/_/g, ' ').toLowerCase()}
                {user.cargo && <span className="text-blue-600 font-semibold">{` • ${user.cargo}`}</span>}
              </div>
            </div>
            
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {/* Muestra la inicial del nombre o un ícono genérico si no hay nombre */}
              {user.name ? (
                <span className="text-blue-600 font-semibold text-sm">
                  {user.name.charAt(0)}
                </span>
              ) : (
                <User className="text-blue-600" size={20} />
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;