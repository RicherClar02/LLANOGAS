// Configuración de Next.js para LLANOGAS
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
   // appDir: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;