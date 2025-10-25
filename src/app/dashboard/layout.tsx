// src/app/dashboard/layout.tsx - VERSIÓN MEJORADA

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

// Definición de tipos de roles (Ayuda a la legibilidad y seguridad)
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

  // Memoizar la lista de roles válidos para evitar recreación innecesaria
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
    // 1. Esperar a que NextAuth cargue el estado
    if (status === 'loading') return; 

    // 2. Redirigir si no hay sesión (No autenticado)
    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = session.user?.role;

    // 3. Redirigir si el rol no es válido (No autorizado)
    if (!userRole || !validRoles.includes(userRole as ValidRole)) {
      router.push('/unauthorized');
      return;
    }

    // Nota: Si el usuario está autenticado y su rol es válido, no se hace nada, 
    // y el componente se renderiza con el contenido.

  }, [session, status, router, validRoles]);

  // Renderizado durante el estado de carga
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

  // Si la sesión no existe, devuelve null para evitar un parpadeo de contenido 
  // antes de que se ejecute la redirección del useEffect.
  if (!session) {
    return null; 
  }

  // Una vez que la sesión existe y el rol ha sido verificado (gracias al useEffect), 
  // se renderiza el dashboard.
  
  // Se usa 'session.user!' para indicar a TypeScript que en este punto 
  // estamos seguros de que existe, resolviendo el error de tipos.
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Se pasa el objeto user completo que contiene el rol y otros datos */}
      <Sidebar user={session.user!} /> 
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={session.user!} />
        
        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}