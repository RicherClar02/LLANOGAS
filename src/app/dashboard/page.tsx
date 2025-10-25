// src/app/dashboard/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { 
  BarChart3, 
  Inbox, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText} from 'lucide-react';

export default function DashboardPage() {
  // 1. Obtener la sesión del usuario
  const { data: session } = useSession();

  // Datos de ejemplo para el dashboard
  const stats = [
    { 
      name: 'Total Casos', 
      value: '24', 
      change: '+12%', 
      changeType: 'positive',
      icon: FileText, // Icono FileText (Total Casos)
      color: 'blue'
    },
    { 
      name: 'Pendientes', 
      value: '8', 
      change: '-2%', 
      changeType: 'negative',
      icon: Clock, // Icono Clock
      color: 'yellow'
    },
    { 
      name: 'Por Vencer', 
      value: '3', 
      change: '+1', 
      changeType: 'negative',
      icon: AlertTriangle, // Icono AlertTriangle
      color: 'red'
    },
    { 
      name: 'Resueltos', 
      value: '16', 
      change: '+15%', 
      changeType: 'positive',
      icon: CheckCircle, // Icono CheckCircle
      color: 'green'
    },
  ];

  const recentCases = [
    { id: 1, entidad: 'SUI', asunto: 'Reporte mensual de consumo', fecha: '2024-01-15', estado: 'Pendiente' },
    { id: 2, entidad: 'SS', asunto: 'Consulta tarifaria', fecha: '2024-01-14', estado: 'En revisión' },
    { id: 3, entidad: 'MME', asunto: 'Solicitud de viabilidad', fecha: '2024-01-13', estado: 'Aprobado' },
  ];

  // 2. Manejo del estado de carga de la sesión (Opcional, pero buena práctica)
  // Si la sesión aún no ha cargado, se puede mostrar un spinner o pantalla de carga.
  // En este caso, simplemente retornamos null o un layout básico para evitar errores si accedemos a session.user
  if (!session) {
      // Nota: Si se accede a esta página sin sesión, el middleware debería redirigir a /login.
      // Si el estado es 'loading', podemos retornar un esqueleto.
      return (
          <div className="flex items-center justify-center h-full text-gray-500">
              Cargando sesión...
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de bienvenida personalizado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido, {session.user.name} 👋
        </h1>
        <p className="text-gray-600">
          {session.user.cargo && `${session.user.cargo} • `} 
          {session.user.proceso && `${session.user.proceso} • `}
          Rol: {session.user.role?.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          // El icono se accede dinámicamente
          const Icon = stat.icon;
          return (
            // Uso de clases Tailwind dinámicas (bg-*, text-*)
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} vs mes anterior
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100 flex-shrink-0`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Casos Recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Casos Recientes</h2>
            {/* Aquí deberías usar un Link de Next.js si quieres navegar */}
            <a href="/dashboard/bandeja" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos
            </a>
          </div>
          <div className="space-y-4">
            {recentCases.map((caseItem) => (
              <a 
                key={caseItem.id} 
                href={`/dashboard/bandeja/${caseItem.id}`}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">{caseItem.entidad}</p>
                    <p className="text-sm text-gray-600 truncate">{caseItem.asunto}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm text-gray-600">{caseItem.fecha}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    caseItem.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    caseItem.estado === 'En revisión' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {caseItem.estado}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <a 
              href="/dashboard/bandeja"
              className="p-4 border border-gray-200 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Inbox className="mx-auto text-blue-600 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-900">Revisar Bandeja</p>
              <p className="text-xs text-gray-600">8 pendientes</p>
            </a>
            <a 
              href="/dashboard/calendario"
              className="p-4 border border-gray-200 rounded-lg text-center hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <Calendar className="mx-auto text-green-600 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-900">Ver Calendario</p>
              <p className="text-xs text-gray-600">3 por vencer</p>
            </a>
            <a 
              href="/dashboard/nuevo-reporte"
              className="p-4 border border-gray-200 rounded-lg text-center hover:bg-purple-50 hover:border-purple-300 transition-colors"
            >
              <FileText className="mx-auto text-purple-600 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-900">Nuevo Reporte</p>
              <p className="text-xs text-gray-600">Generar documento</p>
            </a>
            <a 
              href="/dashboard/metricas"
              className="p-4 border border-gray-200 rounded-lg text-center hover:bg-orange-50 hover:border-orange-300 transition-colors"
            >
              <BarChart3 className="mx-auto text-orange-600 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-900">Ver Métricas</p>
              <p className="text-xs text-gray-600">Estadísticas</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}