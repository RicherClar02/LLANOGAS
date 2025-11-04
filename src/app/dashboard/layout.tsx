// src/app/dashboard/layout.tsx - VERSIÓN CORREGIDA

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

// Definición de tipos de roles
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

  // Estado de carga
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

  // Si no hay sesión, no renderizar nada (la redirección se maneja en useEffect)
  if (!session) {
    return null;
  }

  // Verificación adicional de seguridad antes de renderizar
  if (!session.user?.role || !validRoles.includes(session.user.role as ValidRole)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar con verificación segura */}
      <Sidebar user={{
        id: session.user.id,
        name: session.user.name || 'Usuario',
        email: session.user.email || '',
        role: session.user.role,
        cargo: session.user.cargo || undefined, // CORRECCIÓN: Convierte null/undefined a undefined
        proceso: session.user.proceso || undefined // CORRECCIÓN: Convierte null/undefined a undefined
      }} />
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Asegúrate de que el componente Header acepte las mismas props */}
        <Header user={{
          id: session.user.id,
          name: session.user.name || 'Usuario',
          email: session.user.email || '',
          role: session.user.role,
          cargo: session.user.cargo || undefined, // CORRECCIÓN: Convierte null/undefined a undefined
          proceso: session.user.proceso || undefined // CORRECCIÓN: Convierte null/undefined a undefined
        }} />
        
        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}