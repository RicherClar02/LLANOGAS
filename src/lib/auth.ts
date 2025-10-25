// src/lib/auth.ts
// Configuración centralizada de NextAuth
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NOTA IMPORTANTE:
// Se eliminan los bloques 'declare module "next-auth/jwt"' y 'declare module "next-auth"' 
// de este archivo porque YA EXISTEN en tu archivo de tipos 'src/types/next-auth.d.ts'.
// Tenerlos en ambos archivos causa los errores "All declarations of 'X' must have identical modifiers."

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Buscar usuario en la base de datos
        // Usamos userWithDetails para mayor claridad
        const userWithDetails = await prisma.user.findUnique({
          where: {
            email: credentials.email,
            // Si quieres que solo los usuarios activos puedan iniciar sesión, 
            // DEBES asegurarte de que el campo 'activo' exista en tu modelo Prisma.
            // Si existe y es booleano, DESCOMENTA esta línea:
            // activo: true 
          }
        });

        if (!userWithDetails) {
          return null;
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          userWithDetails.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Retornar solo los campos necesarios para la sesión.
        // Se asegura que NextAuth reciba los campos correctos (id, email, name, role) 
        // y los nuevos campos (cargo, proceso) para que se incluyan en el JWT.
        return {
          id: userWithDetails.id,
          email: userWithDetails.email,
          name: userWithDetails.name,
          role: userWithDetails.role,
          // Se asume que 'cargo' y 'proceso' existen en el modelo User de Prisma.
          cargo: (userWithDetails as any).cargo, 
          proceso: (userWithDetails as any).proceso
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Los datos del usuario se añaden al JWT.
        return {
          ...token,
          id: user.id, 
          role: user.role,
          // Como ya definimos los tipos en next-auth.d.ts, usamos 'as any' aquí.
          // En un proyecto TypeScript puro, la interfaz User extendida ya tendría estos campos.
          cargo: (user as any).cargo, 
          proceso: (user as any).proceso
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Los datos del JWT se añaden al objeto de sesión.
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).cargo = token.cargo;
        (session.user as any).proceso = token.proceso;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    // CORRECCIÓN 1: 'signUp' NO es una propiedad estándar de 'pages'.
    // Solo puedes usar las propiedades definidas por NextAuth.
    // Si necesitas un enlace de registro, DEBERÁS crearlo manualmente en tu página de login.
    // Se elimina la línea: signUp: '/register' 
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// NOTA: El export por defecto de NextAuth se realiza en el archivo API de Next.js
// export default NextAuth(authOptions);