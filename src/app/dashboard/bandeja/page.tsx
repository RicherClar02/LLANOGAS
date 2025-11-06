'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Filter, AlertTriangle, Clock } from 'lucide-react';

// Tipos basados en la respuesta de la API /api/casos
interface Caso {
  id: string;
  radicado: string;
  entidadSigla: string;
  asunto: string;
  estado: string;
  fechaRecepcion: string;
  fechaVencimiento: string;
  responsable: string;
  entidadColor: string;
}

interface CasosResponse {
  casos: Caso[];
  currentPage: number;
  pageSize: number;
  totalCasos: number;
  totalPages: number;
}

// Estados disponibles para el filtro
const ESTADOS = [
  { value: 'TODOS', label: 'Todos los Estados', icon: Clock, color: 'text-gray-600' },
  { value: 'PENDIENTE', label: 'Pendiente', icon: Clock, color: 'text-yellow-600' },
  { value: 'ASIGNADO', label: 'Asignado', icon: Clock, color: 'text-blue-600' },
  { value: 'EN_REVISION', label: 'En Revisión', icon: AlertTriangle, color: 'text-orange-600' },
  { value: 'CERRADO', label: 'Cerrado', icon: Clock, color: 'text-green-600' },
];

// --- Utilidades de estilo ---
const getStatusClasses = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'ASIGNADO': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'EN_REVISION':
    case 'EN_APROBACION': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'CERRADO': 
    case 'ENVIADO': 
    case 'CON_ACUSE': return 'bg-green-100 text-green-800 border-green-300';
    case 'ANULADO': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

// --- Componente Principal de la Bandeja ---
export default function BandejaPage() {
  const { data: session } = useSession();
  const [casosData, setCasosData] = useState<CasosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const pageSize = 10;

  // Función para simular la obtención de datos de casos (MOCK)
  const mockFetchCasos = async (): Promise<CasosResponse> => {
    // Simulación de latencia de red
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const mockCasos: Caso[] = [
      { id: 'C001', radicado: '322-01521-E25', entidadSigla: 'SUI', asunto: 'Reporte mensual de consumo', estado: 'PENDIENTE', fechaRecepcion: '2024-01-15', fechaVencimiento: '2024-02-15', responsable: 'Carlos Velez', entidadColor: '#3B82F6' },
      { id: 'C002', radicado: '322-01522-E25', entidadSigla: 'SS', asunto: 'Consulta tarifaria', estado: 'EN_REVISION', fechaRecepcion: '2024-01-14', fechaVencimiento: '2024-02-14', responsable: 'Ana Gomez', entidadColor: '#10B981' },
      { id: 'C003', radicado: '322-01523-E25', entidadSigla: 'MME', asunto: 'Solicitud de viabilidad', estado: 'CERRADO', fechaRecepcion: '2024-01-13', fechaVencimiento: '2024-02-13', responsable: 'Juan Perez', entidadColor: '#F59E0B' },
      { id: 'C004', radicado: '322-01524-E25', entidadSigla: 'SUI', asunto: 'Requerimiento de información', estado: 'PENDIENTE', fechaRecepcion: '2024-01-12', fechaVencimiento: '2024-02-12', responsable: 'Carlos Velez', entidadColor: '#3B82F6' },
      { id: 'C005', radicado: '322-01525-E25', entidadSigla: 'SS', asunto: 'Ajuste de tarifas 2024', estado: 'ASIGNADO', fechaRecepcion: '2024-01-11', fechaVencimiento: '2024-02-11', responsable: 'Ana Gomez', entidadColor: '#10B981' },
      { id: 'C006', radicado: '322-01526-E25', entidadSigla: 'MME', asunto: 'Aprobación de proyecto', estado: 'EN_APROBACION', fechaRecepcion: '2024-01-10', fechaVencimiento: '2024-02-10', responsable: 'Juan Perez', entidadColor: '#F59E0B' },
      { id: 'C007', radicado: '322-01527-E25', entidadSigla: 'SUI', asunto: 'Queja por servicio', estado: 'CERRADO', fechaRecepcion: '2024-01-09', fechaVencimiento: '2024-02-09', responsable: 'Carlos Velez', entidadColor: '#3B82F6' },
      { id: 'C008', radicado: '322-01528-E25', entidadSigla: 'SS', asunto: 'Consulta de reglamento', estado: 'PENDIENTE', fechaRecepcion: '2024-01-08', fechaVencimiento: '2024-02-08', responsable: 'Ana Gomez', entidadColor: '#10B981' },
      { id: 'C009', radicado: '322-01529-E25', entidadSigla: 'MME', asunto: 'Informe trimestral', estado: 'ASIGNADO', fechaRecepcion: '2024-01-07', fechaVencimiento: '2024-02-07', responsable: 'Juan Perez', entidadColor: '#F59E0B' },
      { id: 'C010', radicado: '322-01530-E25', entidadSigla: 'SUI', asunto: 'Solicitud de certificación', estado: 'EN_REVISION', fechaRecepcion: '2024-01-06', fechaVencimiento: '2024-02-06', responsable: 'Carlos Velez', entidadColor: '#3B82F6' },
    ];

    // Aplicar filtros mock
    let filteredCasos = mockCasos.filter(caso => {
      const estadoMatch = estadoFilter === 'TODOS' || caso.estado === estadoFilter;
      const queryMatch = searchQuery === '' || 
                         caso.radicado.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caso.asunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caso.entidadSigla.toLowerCase().includes(searchQuery.toLowerCase());
      return estadoMatch && queryMatch;
    });

    // Aplicar simulación de filtro por usuario (si no es admin)
    if (session?.user?.role !== 'ADMINISTRADOR_SISTEMA') {
      filteredCasos = filteredCasos.filter(caso => caso.responsable === 'Carlos Velez');
    }

    const totalCasos = filteredCasos.length;
    const totalPages = Math.ceil(totalCasos / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const casosPaginados = filteredCasos.slice(start, end);

    return {
      casos: casosPaginados,
      currentPage: page,
      pageSize,
      totalCasos,
      totalPages,
    };
  };

  const fetchCasos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      // En un entorno real, descomentar el fetch a /api/casos
      // const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString(), estado: estadoFilter, q: searchQuery });
      // const response = await fetch(`/api/casos?${params.toString()}`);
      // if (response.ok) {
      //     const data: CasosResponse = await response.json();
      //     setCasosData(data);
      // } else {
      //     console.error('Error fetching casos:', response.statusText);
      // }

      // Usamos la función mock para la simulación
      const data = await mockFetchCasos();
      setCasosData(data);
    } catch (error) {
      console.error('Error al obtener casos:', error);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter, searchQuery, session]);

  // Ejecutar la carga al cambiar filtros o página
  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetear a la primera página al buscar
    fetchCasos();
  };

  const handlePageChange = (newPage: number) => {
    if (casosData && newPage >= 1 && newPage <= casosData.totalPages) {
      setPage(newPage);
    }
  };

  // Determinar si la fecha de vencimiento está cerca o pasada
  const getVencimientoStatus = (vencimiento: string) => {
    if (vencimiento === 'N/A') return 'text-gray-500';

    const today = new Date();
    // Ajuste para evitar problemas de zona horaria en la comparación de fechas
    today.setHours(0, 0, 0, 0); 
    const vencimientoDate = new Date(vencimiento);
    vencimientoDate.setHours(0, 0, 0, 0);

    const diffTime = vencimientoDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 font-semibold'; // Vencido
    if (diffDays <= 3) return 'text-orange-600 font-semibold'; // Cerca de vencer (3 días o menos)
    return 'text-green-600'; // Bien
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandeja de Casos</h1>
          <p className="text-gray-600">
            {casosData?.totalCasos || 0} {casosData?.totalCasos === 1 ? 'caso' : 'casos'} encontrados
          </p>
        </div>
      </div>

      {/* --- Barra de Filtros y Búsqueda --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por radicado, asunto o entidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Filtro por Estado */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={estadoFilter}
                onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {ESTADOS.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón Limpiar */}
          <div>
            <button 
              onClick={() => { setEstadoFilter('TODOS'); setSearchQuery(''); setPage(1); }}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* --- Tabla de Casos --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Radicado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando casos...
                  </td>
                </tr>
              ) : casosData?.casos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No se encontraron casos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                casosData?.casos.map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link 
                        href={`/dashboard/bandeja/${caso.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {caso.radicado}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: caso.entidadColor }}
                        ></span>
                        <span className="font-medium">{caso.entidadSigla}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="line-clamp-2">{caso.asunto}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caso.responsable}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getVencimientoStatus(caso.fechaVencimiento)}>
                        {new Date(caso.fechaVencimiento).toLocaleDateString('es-ES')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(caso.estado)}`}>
                        {caso.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/dashboard/bandeja/${caso.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Paginación --- */}
      {casosData && casosData.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{(casosData.currentPage - 1) * pageSize + 1}</span> a{' '}
            <span className="font-medium">{Math.min(casosData.currentPage * pageSize, casosData.totalCasos)}</span> de{' '}
            <span className="font-medium">{casosData.totalCasos}</span> resultados
          </p>
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(casosData.currentPage - 1)}
              disabled={casosData.currentPage === 1}
              className={`p-2 border border-gray-300 rounded-lg ${
                casosData.currentPage === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-lg">
              Página {casosData.currentPage} de {casosData.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(casosData.currentPage + 1)}
              disabled={casosData.currentPage === casosData.totalPages}
              className={`p-2 border border-gray-300 rounded-lg ${
                casosData.currentPage === casosData.totalPages 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}