// src/app/unauthorized/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, Home } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si no hay sesión, redirigir al login
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="text-red-600" size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso No Autorizado
        </h1>
        
        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta sección del sistema.
        </p>

        {session?.user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Usuario:</strong> {session.user.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Rol:</strong> {session.user.role.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Home size={20} />
          <span>Volver al Dashboard</span>
        </Link>
      </div>
    </div>
  );
}