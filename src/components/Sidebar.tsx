// src/components/Sidebar.tsx

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
    roles: ['ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'ADMINISTRADOR_SISTEMA', 'REVISOR_JURIDICO', 'APROBADOR']
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
    roles: ['ROL_SEGUIMIENTO', 'AUDITOR', 'ADMINISTRADOR_SISTEMA']
  },
  {
    name: 'Documentos',
    href: '/dashboard/documentos',
    icon: Folder,
    roles: ['ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'REVISOR_JURIDICO', 'APROBADOR', 'ROL_SEGUIMIENTO', 'AUDITOR']
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
  const pathname = usePathname();

  // Filtrar items según el rol del usuario
  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
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
        w-64 bg-white border-r border-gray-200 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {/* Usamos un placeholder simple para el logo */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">LG</span>
            </div>
            <span className="text-xl font-bold text-gray-900">LLANOGAS</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden text-gray-500 hover:text-gray-700"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={20} className={active ? 'text-blue-600' : 'text-gray-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          {/* Info del Usuario */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">
                {/* Genera iniciales */}
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={user.name}>
                {user.name}
              </p>
              {/* Mostrando rol */}
              <p className="text-xs text-blue-600 capitalize">
                {user.role.replace(/_/g, ' ').toLowerCase()}
              </p>
              {/* Opcional: Mostrar cargo si existe */}
              {user.cargo && (
                <p className="text-xs text-gray-500 truncate" title={user.cargo}>
                  {user.cargo}
                </p>
              )}
            </div>
          </div>
          
          {/* Botón Cerrar Sesión */}
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}