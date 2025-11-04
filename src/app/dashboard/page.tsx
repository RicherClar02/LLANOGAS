'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Inbox, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Users,
  FileText
} from 'lucide-react';

interface DashboardData {
  totalCasos: number;
  casosPendientes: number;
  casosPorVencer: number;
  casosResueltos: number;
  casosRecientes: any[];
  tiempoPromedioRespuesta: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del dashboard
  useEffect(() => {
    const cargarDashboardData = async () => {
      try {
        // Por ahora usamos datos mock, pero puedes crear una API específica para el dashboard
        const mockData: DashboardData = {
          totalCasos: 24,
          casosPendientes: 8,
          casosPorVencer: 3,
          casosResueltos: 16,
          tiempoPromedioRespuesta: 2.5,
          casosRecientes: [
            { id: 1, entidad: 'SUI', asunto: 'Reporte mensual de consumo', fecha: '2024-01-15', estado: 'PENDIENTE' },
            { id: 2, entidad: 'SS', asunto: 'Consulta tarifaria', fecha: '2024-01-14', estado: 'EN_REVISION' },
            { id: 3, entidad: 'MME', asunto: 'Solicitud de viabilidad', fecha: '2024-01-13', estado: 'CERRADO' },
          ]
        };
        
        setDashboardData(mockData);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboardData();
  }, []);

  const stats = [
    { 
      name: 'Total Casos', 
      value: dashboardData?.totalCasos.toString() || '0', 
      change: '+12%', 
      changeType: 'positive',
      icon: Inbox,
      color: 'blue'
    },
    { 
      name: 'Pendientes', 
      value: dashboardData?.casosPendientes.toString() || '0', 
      change: '-2%', 
      changeType: 'negative',
      icon: Clock,
      color: 'yellow'
    },
    { 
      name: 'Por Vencer', 
      value: dashboardData?.casosPorVencer.toString() || '0', 
      change: '+1', 
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'red'
    },
    { 
      name: 'Resueltos', 
      value: dashboardData?.casosResueltos.toString() || '0', 
      change: '+15%', 
      changeType: 'positive',
      icon: CheckCircle,
      color: 'green'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de bienvenida */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido, {session?.user?.name} 👋
        </h1>
        <p className="text-gray-600">
          {session?.user?.cargo && `${session.user.cargo} • `} 
          {session?.user?.proceso && `${session.user.proceso} • `}
          Rol: {session?.user?.role?.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} vs mes anterior
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'yellow' ? 'bg-yellow-100' :
                  stat.color === 'red' ? 'bg-red-100' :
                  'bg-green-100'
                }`}>
                  <Icon className={
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'red' ? 'text-red-600' :
                    'text-green-600'
                  } size={24} />
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
            <a href="/dashboard/bandeja" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos
            </a>
          </div>
          <div className="space-y-4">
            {dashboardData?.casosRecientes.map((caseItem) => (
              <div key={caseItem.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{caseItem.entidad}</p>
                    <p className="text-sm text-gray-600">{caseItem.asunto}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{caseItem.fecha}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    caseItem.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                    caseItem.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {caseItem.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/dashboard/bandeja" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors block">
              <Inbox className="mx-auto text-blue-600 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-900">Revisar Bandeja</p>
              <p className="text-xs text-gray-600">{dashboardData?.casosPendientes || 0} pendientes</p>
            </a>
            <a href="/dashboard/calendario" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors block">
              <Calendar className="mx-auto text-green-600 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-900">Ver Calendario</p>
              <p className="text-xs text-gray-600">{dashboardData?.casosPorVencer || 0} por vencer</p>
            </a>
            <a href="/dashboard/documentos" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors block">
              <FileText className="mx-auto text-purple-600 mb-2" size={24} />
              <p className="text-sm font-medium text-gray-900">Nuevo Reporte</p>
              <p className="text-xs text-gray-600">Generar documento</p>
            </a>
            <a href="/dashboard/metricas" className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors block">
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