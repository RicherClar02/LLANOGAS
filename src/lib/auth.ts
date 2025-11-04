import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient, UserRole } from '@prisma/client'; // <-- Importar UserRole
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Exportar prisma desde aquí es una buena práctica
export const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Si el login es exitoso, devuelve el objeto usuario completo
        // con el ID y el ROL para el callback JWT.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // <-- CAMBIO CLAVE
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    // signOut: '/auth/signout',
    // error: '/auth/error', 
    // verifyRequest: '/auth/verify-request', 
    // newUser: '/auth/new-user'
  },
  callbacks: {
    // 1. Callback 'jwt': Se ejecuta al crear/actualizar el token.
    async jwt({ token, user }) {
      // 'user' solo está disponible en el inicio de sesión inicial.
      if (user) {
        token.id = user.id;
        token.role = user.role; // <-- CAMBIO CLAVE: Añade el rol al JWT
      }
      return token;
    },
    // 2. Callback 'session': Se ejecuta al consultar la sesión.
    async session({ session, token }) {
      // Pasa el id y el rol desde el JWT a la sesión.
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole; // <-- CAMBIO CLAVE: Añade el rol a la sesión
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Exportar el handler de NextAuth
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);