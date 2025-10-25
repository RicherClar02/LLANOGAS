// src/types/next-auth.d.ts
// Extensión de tipos para NextAuth
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// ------------------------------------
// EXTENSIÓN PARA EL OBJETO DE SESIÓN
// ------------------------------------
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      cargo?: string; // 👈 Campo nuevo (opcional)
      proceso?: string; // 👈 Campo nuevo (opcional)
    } & DefaultSession["user"];
  }

  // ------------------------------------
  // EXTENSIÓN PARA EL OBJETO DE USUARIO (USADO EN 'authorize')
  // ------------------------------------
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    cargo?: string; // 👈 Campo nuevo (opcional)
    proceso?: string; // 👈 Campo nuevo (opcional)
  }
}

// ------------------------------------
// EXTENSIÓN PARA EL OBJETO JWT
// ------------------------------------
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    cargo?: string; // 👈 Campo nuevo (opcional)
    proceso?: string; // 👈 Campo nuevo (opcional)
  }
}