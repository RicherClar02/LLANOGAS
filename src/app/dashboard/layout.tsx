'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

type ValidRole = 
  | 'ADMINISTRADOR_SISTEMA'
  | 'ADMINISTRADOR_ASIGNACIONES' 
  | 'GESTOR'
  | 'REVISOR_JURIDICO'
  | 'APROBADOR'
  | 'ROL_SEGUIMIENTO'
  | 'AUDITOR';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const validRoles: ValidRole[] = useMemo(() => [
    'ADMINISTRADOR_SISTEMA',
    'ADMINISTRADOR_ASIGNACIONES', 
    'GESTOR',
    'REVISOR_JURIDICO',
    'APROBADOR',
    'ROL_SEGUIMIENTO',
    'AUDITOR'
  ], []);

  useEffect(() => {
    if (status === 'loading') return; 

    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = session.user?.role;

    if (!userRole || !validRoles.includes(userRole as ValidRole)) {
      router.push('/unauthorized');
      return;
    }

  }, [session, status, router, validRoles]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso y permisos...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!session.user?.role || !validRoles.includes(session.user.role as ValidRole)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:inset-auto lg:flex ${
        sidebarOpen ? 'flex' : 'hidden lg:flex'
      }`}>
        <Sidebar 
          user={{
            id: session.user.id,
            name: session.user.name || 'Usuario',
            email: session.user.email || '',
            role: session.user.role,
            cargo: session.user.cargo || undefined,
            proceso: session.user.proceso || undefined
          }} 
        />
      </div>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header 
          user={{
            name: session.user.name || 'Usuario',
            email: session.user.email || '',
            role: session.user.role,
            cargo: session.user.cargo || undefined,
            proceso: session.user.proceso || undefined
          }}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}