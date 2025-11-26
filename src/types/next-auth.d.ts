import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';
import { UserRole } from '@prisma/client'; // <-- IMPORTANTE: Importar el enum

declare module 'next-auth' {
  /**
   * Extiende la sesión para incluir el id y el rol.
   */
  interface Session {
    user: {
      id: string;
      role: UserRole; 
    } & DefaultSession['user'];
  }

  /**
   * Extiende el usuario para incluir el id y el rol.
   */
  interface User extends DefaultUser {
    id: string;
    role: UserRole; // <-- CAMBIO CLAVE
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extiende el token JWT para incluir el id y el rol.
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole; // <-- CAMBIO CLAVE
  }
}