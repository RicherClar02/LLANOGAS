import 'next-auth';
import { DefaultSession } from 'next-auth';

// ---------------------------------------------------------------------
// 1. Extender la Interfaz de Sesión (usada en useSession, getSession)
// ---------------------------------------------------------------------

declare module 'next-auth' {
  /**
   * Extiende la interfaz Session para incluir propiedades personalizadas
   * que vienen del JWT y son añadidas en el callback 'session'.
   */
  interface Session {
    user: {
      id: string; // ID del usuario de la base de datos (añadido en el JWT)
      name: string;
      email: string;
      // Define el tipo exacto que usa tu enum de Prisma (UserRole)
      role: 
        | 'ADMINISTRADOR_SISTEMA' 
        | 'ADMINISTRADOR_ASIGNACIONES' 
        | 'GESTOR' 
        | 'REVISOR_JURIDICO' 
        | 'APROBADOR' 
        | 'ROL_SEGUIMIENTO' 
        | 'AUDITOR'; 
      // Las hacemos opcionales (?) para ser consistentes con el schema.prisma
      cargo?: string | null; // Acepta null ya que viene de DB (String?)
      proceso?: string | null; // Acepta null ya que viene de DB (String?)
    } & DefaultSession['user'];
  }

  /**
   * Extiende la interfaz User para la función signIn
   * (Datos que vienen directamente de la base de datos)
   */
  interface User {
    role: 
        | 'ADMINISTRADOR_SISTEMA' 
        | 'ADMINISTRADOR_ASIGNACIONES' 
        | 'GESTOR' 
        | 'REVISOR_JURIDICO' 
        | 'APROBADOR' 
        | 'ROL_SEGUIMIENTO' 
        | 'AUDITOR';
    // Las hacemos opcionales (?)
    cargo?: string | null;
    proceso?: string | null;
  }
}

// ---------------------------------------------------------------------
// 2. Extender la Interfaz JWT (usada en el callback 'jwt')
// ---------------------------------------------------------------------

import 'next-auth/jwt';

declare module 'next-auth/jwt' {
  /**
   * Extiende la interfaz JWT para incluir las propiedades personalizadas
   * que se guardan en el token cifrado.
   */
  interface JWT {
    id: string; // Necesario para el tipado consistente
    name?: string | null;
    email?: string | null;
    role: 
        | 'ADMINISTRADOR_SISTEMA' 
        | 'ADMINISTRADOR_ASIGNACIONES' 
        | 'GESTOR' 
        | 'REVISOR_JURIDICO' 
        | 'APROBADOR' 
        | 'ROL_SEGUIMIENTO' 
        | 'AUDITOR';
    // Las hacemos opcionales (?) y aceptando null
    cargo?: string | null;
    proceso?: string | null;
  }
}
