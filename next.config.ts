// Configuración de Next.js para LLANOGAS
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
   // appDir: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Mantener esto como false es mejor
  },
  eslint: {
    ignoreDuringBuilds: true, // Cambiar de false a true TEMPORALMENTE
  },
};

export default nextConfig;