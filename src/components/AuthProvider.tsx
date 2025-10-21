// src/components/AuthProvider.tsx
// Provider para manejar la sesión de NextAuth
'use client';
import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}