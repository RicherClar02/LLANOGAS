'use client';

import { signOut } from 'next-auth/react';
import { User, LogOut, Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import NotificationBadge from './NotificationBadge';

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
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'ADMINISTRADOR_SISTEMA': 'Administrador del Sistema',
      'ADMINISTRADOR_ASIGNACIONES': 'Administrador de Asignaciones',
      'GESTOR': 'Gestor',
      'REVISOR_JURIDICO': 'Revisor Jurídico',
      'APROBADOR': 'Aprobador',
      'ROL_SEGUIMIENTO': 'Seguimiento',
      'AUDITOR': 'Auditor'
    };
    return roleNames[role] || role.replace(/_/g, ' ').toLowerCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and brand */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          {/* Brand/Logo */}
          <div className="flex flex-col">
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
              Sistema de Gestión LLANOGAS
            </h1>
            <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
              Plataforma de seguimiento de correos
            </p>
          </div>
        </div>

        {/* Center - Search bar (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar casos, documentos, correos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar"
          >
            <Search size={20} />
          </button>

          {/* Notification Badge */}
          <NotificationBadge />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-1.5 lg:p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Menú de usuario"
            >
              <div className="hidden sm:block text-right min-w-[120px]">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={user.name}>
                  {user.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {getRoleDisplayName(user.role)}
                </div>
              </div>
              
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                {user.name ? (
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="text-white" size={18} />
                )}
              </div>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <>
                {/* Overlay para cerrar al hacer clic fuera */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {getRoleDisplayName(user.role)}
                      </span>
                      {user.cargo && (
                        <span className="text-xs text-gray-500 truncate max-w-[120px]">
                          {user.cargo}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Logout button */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                  >
                    <LogOut size={16} className="flex-shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar - Toggle */}
      {searchOpen && (
        <div className="lg:hidden mt-3 animate-slideDown">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar casos, documentos, correos..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              autoFocus
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Agregar estilos de animación */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Header;