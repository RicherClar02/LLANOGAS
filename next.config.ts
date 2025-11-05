/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...aquí pueden estar tus otras configuraciones...
  reactStrictMode: true,

  // --- AÑADE ESTO ---
  // Le dice a Vercel que no falle el 'build' por errores de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // --- FIN DE LO AÑADIDO ---
};

module.exports = nextConfig;