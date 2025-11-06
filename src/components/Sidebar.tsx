'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  BarChart3,
  Folder,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Bell
} from 'lucide-react';
import { signOut } from 'next-auth/react'; 

interface User {
  id: string; 
  name: string;
  email: string;
  role: string;
  cargo?: string; 
  proceso?: string;
}

interface SidebarProps {
  user: User;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'ROL_SEGUIMIENTO', 'AUDITOR']
  },
  {
    name: 'Bandeja',
    href: '/dashboard/bandeja',
    icon: Inbox,
    roles: ['ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'ADMINISTRADOR_SISTEMA', 'REVISOR_JURIDICO', 'APROBADOR', 'ROL_SEGUIMIENTO']
  },
  {
    name: 'Calendario',
    href: '/dashboard/calendario',
    icon: Calendar,
    roles: ['ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'ROL_SEGUIMIENTO', 'ADMINISTRADOR_SISTEMA']
  },
  {
    name: 'Métricas',
    href: '/dashboard/metricas',
    icon: BarChart3,
    roles: ['ROL_SEGUIMIENTO', 'AUDITOR', 'ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES']
  },
  {
    name: 'Documentos',
    href: '/dashboard/documentos',
    icon: FileText,
    roles: ['ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'REVISOR_JURIDICO', 'APROBADOR', 'ROL_SEGUIMIENTO', 'AUDITOR']
  },
  {
    name: 'Notificaciones',
    href: '/dashboard/notificaciones',
    icon: Bell,
    roles: ['ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'ROL_SEGUIMIENTO', 'AUDITOR']
  },
  {
    name: 'Configuración',
    href: '/dashboard/configuracion',
    icon: Settings,
    roles: ['ADMINISTRADOR_SISTEMA']
  }
];

export default function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const filteredNavigation = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (!user?.role) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        
        {/* Logo and toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LG</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Llanogas</h1>
                <p className="text-xs text-gray-600">Dashboard</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsOpen(false)} 
              className="lg:hidden text-gray-500 hover:text-gray-700"
              aria-label="Cerrar menú"
            >
              <X size={16} />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* User Info - Solo mostrar cuando no está colapsado */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={user.name}>
                  {user.name}
                </p>
                <p className="text-xs text-blue-600 capitalize">
                  {user?.role ? user.role.replace(/_/g, ' ').toLowerCase() : 'usuario'}
                </p>
                {user.cargo && (
                  <p className="text-xs text-gray-500 truncate" title={user.cargo}>
                    {user.cargo}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                  ${active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={collapsed ? item.name : undefined}
              >
                <Icon 
                  size={20} 
                  className={`flex-shrink-0 ${
                    active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} 
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Solo mostrar cuando no está colapsado */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p>Gases del Llano SA ESP</p>
              <p className="mt-1">v1.0.0</p>
            </div>
            
            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 w-full px-3 py-2 mt-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        {/* Footer colapsado - Solo mostrar ícono de logout */}
        {collapsed && (
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}