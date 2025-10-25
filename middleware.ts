// middleware.ts (en la raíz del proyecto)
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // El middleware se ejecuta para rutas protegidas
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Rutas que requieren autenticación
        const protectedPaths = [
          '/dashboard',
          '/dashboard/bandeja',
          '/dashboard/calendario', 
          '/dashboard/metricas',
          '/dashboard/documentos',
          '/dashboard/configuracion'
        ];

        const isProtectedPath = protectedPaths.some(path => 
          req.nextUrl.pathname.startsWith(path)
        );

        // Si es una ruta protegida, requiere token válido
        if (isProtectedPath) {
          return !!token;
        }

        // Rutas públicas no requieren token
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bandeja/:path*',
  ]
};