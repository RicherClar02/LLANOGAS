// src/components/Sidebar.tsx
// Componente de barra lateral con navegación
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Mail, 
  Calendar, 
  BarChart3, 
  Folder, 
  Settings,
  LogOut
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface User {
  name: string;
  email: string;
  role: string;
}

interface SidebarProps {
  user: User;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bandeja', href: '/dashboard/bandeja', icon: Mail },
  { name: 'Calendario', href: '/dashboard/calendario', icon: Calendar },
  { name: 'Métricas', href: '/dashboard/metricas', icon: BarChart3 },
  { name: 'Documentos', href: '/dashboard/documentos', icon: Folder },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LG</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">LLANOGAS</h1>
            <p className="text-xs text-gray-500">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Información del usuario */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <p className="text-xs text-blue-600 capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>
        
        {/* Botón Cerrar Sesión */}
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}