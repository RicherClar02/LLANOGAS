'use client';

import { signOut } from 'next-auth/react';
import { User, LogOut, Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import Notifications from './Notifications';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    cargo?: string;
    proceso?: string;
  };
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and search */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-900">
              Sistema de Gestión LLANOGAS
            </h1>
            <p className="text-gray-600 text-sm">
              Plataforma de seguimiento de correos
            </p>
          </div>

          {/* Search bar - Desktop */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar casos, documentos..."
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-4">
          {/* Search button - Mobile */}
          <button className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Search size={20} />
          </button>

          {/* Notifications */}
          <Notifications />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
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
                {user.name ? (
                  <span className="text-blue-600 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="text-blue-600" size={20} />
                )}
              </div>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  {user.cargo && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{user.cargo}</p>
                  )}
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar - Mobile */}
      <div className="lg:hidden mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar casos, documentos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;