// Página Principal - Landing Page de LLANOGAS
'use client';
import React from 'react';
// Este componente asume que Tailwind CSS está disponible en el entorno de ejecución.

/**
 * Interfaz de TypeScript para las propiedades del componente FeatureCard.
 * Esto resuelve el error de 'implicit any type' en entornos TypeScript.
 */
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color?: string; // Propiedad opcional
}

/**
 * Componente para renderizar las tarjetas de funcionalidades.
 * Aplica estilos modernos con sombras y efecto hover.
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => (
  <div className="bg-white p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border border-blue-50/50">
    <div className={`w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-5 border-4 border-blue-200/50`}>
      {/* El color del ícono se fuerza a blue-700 para mantener la cohesión visual */}
      <span className={`text-2xl text-blue-700`}>{icon}</span>
    </div>
    <h3 className="text-xl font-extrabold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 text-base">{description}</p>
  </div>
);

// El componente principal debe ser nombrado App y ser la exportación por defecto
export default function App() {
  const LLANOGAS_URL = "https://www.llanogas.com/";
  // La ruta para Iniciar Sesión se mantiene, asumiendo que es el punto de acceso al sistema
  const LOGIN_URL = "/login";

  return (
    // Fondo de la aplicación ahora es completamente blanco (bg-white)
    <div className="min-h-screen font-sans bg-white">
      
      {/* Header - Sticky y Estilizado */}
      <header className="sticky top-0 z-10 bg-white shadow-lg shadow-blue-50/50 border-b border-blue-100/50">
        <div className="container mx-auto px-6 lg:px-10 py-4 flex justify-between items-center max-w-7xl">
          <div className="flex items-center space-x-2">
            {/* Logo de LLANOGAS - SIN la función onError */}
            <img 
              src="/images/llanogas.png" 
              alt="Logo de Llanogas" 
              // Asegura que el logo tenga un buen tamaño en el header
              className="w-auto h-12"
            />
          </div>
          <nav className="flex items-center space-x-4 sm:space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-700 font-medium transition-colors hidden sm:block">
              Características
            </a>
            <a 
              href={LOGIN_URL} 
              className="text-blue-700 font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-transparent"
            >
              Iniciar Sesión
            </a>
            {/* Botón: Ir a LLANOGAS (Redirige al sitio corporativo) */}
            <a 
              href={LLANOGAS_URL} 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/50 hover:bg-blue-800 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Ir a LLANOGAS
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section - Diseño Centrado y Limpio */}
      <main className="container mx-auto px-6 lg:px-10 py-24 lg:py-32 max-w-5xl">
        <div className="text-center">
          {/* Título y Subtítulo */}
          <h1 className="text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
            Gestión Regulatoria <span className="text-blue-600 block sm:inline">Simplificada.</span>
          </h1>
          <p className="text-xl text-gray-700 mb-12 leading-relaxed max-w-3xl mx-auto">
            Centraliza y automatiza el <strong className="font-semibold">control y reporte</strong> de obligaciones ante todas las entidades reguladoras. Cumplimiento total, sin esfuerzo, enfocado en la transparencia LLANOGAS.
          </p>
          
          {/* Botón CTA principal */}
          <a 
            href={LOGIN_URL} 
            className="inline-flex items-center justify-center bg-blue-600 text-white text-xl px-12 py-4 rounded-xl font-bold shadow-lg shadow-blue-400/50 hover:bg-blue-700 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-xl"
          >
            Comenzar Ahora
          </a>
        </div>
      </main>

      {/* Sección de Características Destacadas - Fondo con un toque de azul muy claro */}
      <div className="bg-blue-50/50 py-16" id="features"> 
        <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
            <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-16">
                Funcionalidades Clave
            </h2>
            
            {/* Grid de Features */}
            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon="📩" 
                    title="Bandeja Regulatoria Única"
                    description="Clasifica automáticamente toda la correspondencia de las entidades de control, asegurando que nada se pierda."
                />

                <FeatureCard 
                    icon="⚙️" 
                    title="Automatización de Cumplimiento"
                    description="Genera recordatorios, asigna responsables y documenta el proceso de respuesta para cada requerimiento."
                />

                <FeatureCard 
                    icon="🚀" 
                    title="Panel de Rendimiento (KPIs)"
                    description="Visualiza el estado de cumplimiento en tiempo real con métricas claras y reportes exportables para auditoría."
                />
            </div>
        </div>
      </div>
      

      {/* Footer - Diseño Sencillo y Corporativo */}
      <footer className="bg-blue-700 mt-20">
        <div className="container mx-auto px-6 lg:px-10 py-6 max-w-7xl text-center text-white/80">
          <p className="text-sm">© 2024 LLANOGAS - Sistema de Gestión de Reportes. | <span className="font-semibold">Cumplimiento Total. Control Absoluto.</span></p>
        </div>
      </footer>
    </div>
  );
}