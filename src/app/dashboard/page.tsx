// src/app/dashboard/page.tsx
// Página principal del Dashboard con métricas y resumen - VERSIÓN CORREGIDA
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight,
  FileText,
  BarChart3, // 👈 Agregar este import
  Folder // 👈 Agregar este import
} from 'lucide-react';

// Datos de ejemplo - luego vendrán de la API
const mockStats = {
  totalCasos: 24,
  pendientes: 8,
  resueltos: 16,
  porVencer: 3,
  tiempoPromedio: '2.5 días'
};

const mockCasosRecientes = [
  { id: 1, entidad: 'SUI', asunto: 'Reporte mensual de consumo', prioridad: 'ALTA', fecha: '2024-01-15' },
  { id: 2, entidad: 'Superservicios', asunto: 'Encuesta de satisfacción', prioridad: 'MEDIA', fecha: '2024-01-14' },
  { id: 3, entidad: 'SUI', asunto: 'Actualización de datos', prioridad: 'BAJA', fecha: '2024-01-13' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(mockStats);
  const [casosRecientes, setCasosRecientes] = useState(mockCasosRecientes);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema</p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Casos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Casos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCasos}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600">
            <ArrowUpRight size={16} />
            <span>12% vs mes anterior</span>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendientes}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Mail className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-red-600">
            <AlertTriangle size={16} />
            <span>Requieren atención</span>
          </div>
        </div>

        {/* Por Vencer */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Por Vencer</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.porVencer}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-orange-600">
            <AlertTriangle size={16} />
            <span>Próximos 7 días</span>
          </div>
        </div>

        {/* Resueltos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resueltos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.resueltos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm text-green-600">
            <span>Tiempo promedio: {stats.tiempoPromedio}</span>
          </div>
        </div>
      </div>

      {/* Contenido en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Casos Recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Casos Recientes</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {casosRecientes.map((caso) => (
                <div key={caso.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        caso.prioridad === 'ALTA' ? 'bg-red-500' :
                        caso.prioridad === 'MEDIA' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-900">{caso.entidad}</span>
                    </div>
                    <p className="text-sm text-gray-600">{caso.asunto}</p>
                    <p className="text-xs text-gray-400 mt-1">{caso.fecha}</p>
                  </div>
                  <Link 
                    href={`/dashboard/bandeja/${caso.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Ver
                  </Link>
                </div>
              ))}
            </div>
            <Link 
              href="/dashboard/bandeja"
              className="block text-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos los casos
            </Link>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link 
                href="/dashboard/bandeja"
                className="p-4 border border-gray-200 rounded-lg text-center hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Mail className="mx-auto text-blue-600 mb-2" size={24} />
                <p className="font-medium text-gray-900">Revisar Bandeja</p>
                <p className="text-sm text-gray-600">8 pendientes</p>
              </Link>

              <Link 
                href="/dashboard/calendario"
                className="p-4 border border-gray-200 rounded-lg text-center hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <Calendar className="mx-auto text-green-600 mb-2" size={24} />
                <p className="font-medium text-gray-900">Ver Calendario</p>
                <p className="text-sm text-gray-600">3 por vencer</p>
              </Link>

              <Link 
                href="/dashboard/metricas"
                className="p-4 border border-gray-200 rounded-lg text-center hover:bg-purple-50 hover:border-purple-200 transition-colors"
              >
                <BarChart3 className="mx-auto text-purple-600 mb-2" size={24} />
                <p className="font-medium text-gray-900">Ver Métricas</p>
                <p className="text-sm text-gray-600">Reportes</p>
              </Link>

              <Link 
                href="/dashboard/documentos"
                className="p-4 border border-gray-200 rounded-lg text-center hover:bg-orange-50 hover:border-orange-200 transition-colors"
              >
                <Folder className="mx-auto text-orange-600 mb-2" size={24} />
                <p className="font-medium text-gray-900">Documentos</p>
                <p className="text-sm text-gray-600">Repositorio</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}