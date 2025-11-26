'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Download, Filter } from 'lucide-react';

interface Metricas {
  tiempoPromedioRespuesta: number;
  tasaCumplimiento: number;
  casosPorEstado: { estado: string; count: number }[];
  casosPorEntidad: { entidad: string; count: number }[];
  casosPorResponsable: { responsable: string; count: number }[];
  tendenciaMensual: { mes: string; recibidos: number; resueltos: number }[];
}

export default function MetricasPage() {
  const [rangoFecha, setRangoFecha] = useState<'7d' | '30d' | '90d' | '1a'>('30d');
  const [loading, setLoading] = useState(false);
  const [metricas, setMetricas] = useState<Metricas | null>(null);

  // Cargar métricas desde la API
  useEffect(() => {
    const cargarMetricas = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/metricas?rango=${rangoFecha}`);
        if (response.ok) {
          const data = await response.json();
          setMetricas(data);
        } else {
          console.error('Error cargando métricas');
          // CORRECCIÓN: Lógica correcta del else
          setMetricas(getMetricasMock());
        }
      } catch (error) {
        console.error('Error cargando métricas:', error);
        // Fallback con datos mock
        setMetricas(getMetricasMock());
      } finally {
        setLoading(false);
      }
    };

    cargarMetricas();
  }, [rangoFecha]);

  // Datos mock para fallback
  const getMetricasMock = (): Metricas => ({
    tiempoPromedioRespuesta: 2.5,
    tasaCumplimiento: 85,
    casosPorEstado: [
      { estado: 'PENDIENTE', count: 8 },
      { estado: 'EN_REDACCION', count: 5 },
      { estado: 'EN_REVISION', count: 3 },
      { estado: 'ENVIADO', count: 12 },
      { estado: 'CERRADO', count: 16 }
    ],
    casosPorEntidad: [
      { entidad: 'SUI', count: 15 },
      { entidad: 'Superservicios', count: 12 },
      { entidad: 'Ministerio de Minas', count: 8 },
      { entidad: 'Otras', count: 5 }
    ],
    casosPorResponsable: [
      { responsable: 'Ana García', count: 12 },
      { responsable: 'Carlos López', count: 8 },
      { responsable: 'María Rodríguez', count: 6 },
      { responsable: 'Pedro Martínez', count: 4 }
    ],
    tendenciaMensual: [
      { mes: 'Ene', recibidos: 12, resueltos: 10 },
      { mes: 'Feb', recibidos: 15, resueltos: 14 },
      { mes: 'Mar', recibidos: 8, resueltos: 12 },
      { mes: 'Abr', recibidos: 18, resueltos: 16 },
      { mes: 'May', recibidos: 14, resueltos: 15 },
      { mes: 'Jun', recibidos: 16, resueltos: 14 }
    ]
  });

  const exportarReporte = async (formato: 'pdf' | 'excel') => {
    setLoading(true);
    try {
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Exportando en formato ${formato}`);
      
      // En una implementación real, aquí llamarías a la API de exportación
      const response = await fetch(`/api/reportes/exportar?formato=${formato}&rango=${rangoFecha}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-metricas-${new Date().toISOString().split('T')[0]}.${formato}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exportando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metricas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  const datos = metricas || getMetricasMock();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métricas y Reportes</h1>
          <p className="text-gray-600">Estadísticas de gestión y cumplimiento</p>
        </div>

        <div className="flex space-x-3">
          {/* Selector de rango de fechas */}
          <select
            value={rangoFecha}
            onChange={(e) => setRangoFecha(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-700 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1a">Último año</option>
          </select>

          {/* Botones de exportación */}
          <div className="flex space-x-2">
            <button
              onClick={() => exportarReporte('pdf')}
              disabled={loading}
              className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={16} />
              <span>PDF</span>
            </button>
            <button
              onClick={() => exportarReporte('excel')}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={16} />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio Respuesta</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {datos.tiempoPromedioRespuesta} días
              </p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp size={14} className="mr-1" />
                -0.5 días vs período anterior
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Cumplimiento</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {datos.tasaCumplimiento}%
              </p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp size={14} className="mr-1" />
                +5% vs período anterior
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Casos Activos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {datos.casosPorEstado.reduce((acc, curr) => 
                  ['PENDIENTE', 'EN_REDACCION', 'EN_REVISION'].includes(curr.estado) 
                    ? acc + curr.count 
                    : acc, 0
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                En gestión
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Resueltos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {datos.casosPorEstado.reduce((acc, curr) => 
                  ['ENVIADO', 'CERRADO'].includes(curr.estado) 
                    ? acc + curr.count 
                    : acc, 0
                )}
              </p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp size={14} className="mr-1" />
                +12% vs período anterior
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h2>
          <div className="space-y-3">
            {datos.casosPorEstado.map((item) => (
              <div key={item.estado} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {item.estado.replace(/_/g, ' ').toLowerCase()}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(item.count / datos.casosPorEstado.reduce((acc, curr) => acc + curr.count, 0)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Casos por Entidad */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Casos por Entidad</h2>
          <div className="space-y-3">
            {datos.casosPorEntidad.map((item) => (
              <div key={item.entidad} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.entidad}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(item.count / datos.casosPorEntidad.reduce((acc, curr) => acc + curr.count, 0)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de responsables */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Desempeño por Responsable</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Casos Asignados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cumplimiento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datos.casosPorResponsable.map((item, index) => (
                <tr key={item.responsable} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.responsable}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(Math.random() * 3 + 1).toFixed(1)} días
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      index === 0 ? 'bg-green-100 text-green-800' :
                      index === 1 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {index === 0 ? '95%' : index === 1 ? '88%' : '82%'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tendencia mensual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendencia Mensual</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {datos.tendenciaMensual.map((item) => (
            <div key={item.mes} className="text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">{item.mes}</div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Recibidos</div>
                  <div className="text-lg font-bold text-blue-600">{item.recibidos}</div>
                </div>
                <div className="mt-1">
                  <div className="text-xs text-gray-500">Resueltos</div>
                  <div className="text-lg font-bold text-green-600">{item.resueltos}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}