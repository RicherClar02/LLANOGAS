// Página Principal - Landing Page de LLANOGAS
'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
                    src="/images/llanogas.png" 
                    alt="Logo de Llanogas" 
                    className="w-35 h-12"
                    onError={(e) => { 
                        e.currentTarget.onerror = null; 
                        e.currentTarget.style.display = 'none';
                        const span = document.createElement('span');
                        span.textContent = 'LG';
                        span.className = 'text-blue-800 text-sm font-extrabold';
                        e.currentTarget.parentElement?.appendChild(span);
                    }} 
                />
          </div>
          <nav className="flex space-x-6">
            <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="text-gray-600 hover:text-blue-600 font-medium">
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sistema de Gestión de Reportes
            <span className="text-blue-600 block">Entidades de Control</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Centraliza y gestiona todos tus reportes a entidades de control desde una 
            plataforma única. Automatiza procesos, recibe alertas y mantén el control 
            total de tus obligaciones regulatorias.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Comenzar Ahora
            </Link>
            <Link 
              href="/dashboard" 
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 font-bold">📨</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Bandeja Centralizada</h3>
            <p className="text-gray-600">
              Gestiona todos los correos de entidades en un solo lugar con clasificación automática.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 font-bold">🗓️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Calendario Inteligente</h3>
            <p className="text-gray-600">
              Never pierdas un vencimiento con alertas proactivas y recordatorios automáticos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-600 font-bold">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Métricas en Tiempo Real</h3>
            <p className="text-gray-600">
              Monitorea el cumplimiento con dashboards interactivos y reportes exportables.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2026 LLANOGAS - Sistema de Gestión de Reportes. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}