'use client';

import { useState, useEffect, useMemo } from 'react';
// Se elimina la importación de 'next/link' para solucionar el error de compilación.
import {
  Filter,
  Search,
  Mail,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  AlertOctagon,
} from 'lucide-react';

// Tipos para los casos
interface Caso {
  id: string;
  asunto: string;
  descripcion?: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  estado: 'PENDIENTE' | 'ASIGNADO' | 'EN_PROGRESO' | 'RESPONDIDO' | 'CERRADO';
  entidad: {
    nombre: string;
    sigla: string;
    color: string;
  };
  responsable?: {
    name: string;
  };
  fechaRecepcion: string;
  fechaVencimiento?: string;
}

// Definición de todas las entidades posibles para los filtros (Asumiendo que se conocen de antemano)
const ALL_ENTITIES = [
  { sigla: 'SUI', nombre: 'Superintendencia de Servicios Públicos' },
  { sigla: 'SS', nombre: 'Superservicios' },
  { sigla: 'MME', nombre: 'Ministerio de Minas y Energía' },
  { sigla: 'CREG', nombre: 'Comisión de Regulación' },
];

export default function BandejaPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Estado para manejar errores de API
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    prioridad: 'todos',
    entidad: 'todos',
    search: '',
  });

  // Cargar casos desde la API
  const cargarCasos = useMemo(() => async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      
      // Aplicar filtros al URLSearchParams
      if (filtros.estado !== 'todos') params.append('estado', filtros.estado);
      if (filtros.prioridad !== 'todos') params.append('prioridad', filtros.prioridad);
      if (filtros.entidad !== 'todos') params.append('entidad', filtros.entidad);
      if (filtros.search) params.append('search', filtros.search);

      // Llamada a la API
      const response = await fetch(`/api/casos?${params}`);
      
      if (!response.ok) {
        // Intentar leer el error del cuerpo de la respuesta si está disponible
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.message || 'Error al cargar casos'}`);
      }

      const data = await response.json();
      setCasos(data.casos || []); // Asumiendo que la respuesta es { casos: Caso[] }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los casos.';
      setError(errorMessage);
      console.error('Error al cargar casos:', err);
      setCasos([]); // Limpiar casos en caso de error
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Ejecutar la carga de casos cada vez que cambian los filtros
  useEffect(() => {
    cargarCasos();
  }, [cargarCasos]);

  // Usaremos `casos` directamente ya que los filtros se aplican en la API.
  const casosMostrados = casos;


  // Función para obtener los estilos según prioridad
  const getPrioridadStyles = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJA':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener los estilos según estado
  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-gray-100 text-gray-800';
      case 'ASIGNADO':
        return 'bg-blue-100 text-blue-800';
      case 'EN_PROGRESO':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESPONDIDO':
        return 'bg-green-100 text-green-800';
      case 'CERRADO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el ícono según estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Clock size={16} />;
      case 'ASIGNADO':
        return <User size={16} />;
      case 'EN_PROGRESO':
        return <AlertTriangle size={16} />;
      case 'RESPONDIDO':
        return <CheckCircle size={16} />;
      case 'CERRADO':
        return <CheckCircle size={16} />;
      default:
        return <Mail size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bandeja de Entrada</h1>
            <p className="text-gray-600">Gestiona todos los casos y reportes</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando casos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandeja de Entrada</h1>
          <p className="text-gray-600">
            {casosMostrados.length} {casosMostrados.length === 1 ? 'caso' : 'casos'} encontrados
          </p>
        </div>

        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Nuevo Caso
          </button>
        </div>
      </div>

      {/* Mensaje de Error (si existe) */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-sm flex items-center space-x-3" role="alert">
          <AlertOctagon size={20} className="flex-shrink-0" />
          <span className="block sm:inline font-medium">Error de Carga: {error}</span>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar en asuntos, descripciones..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ASIGNADO">Asignado</option>
              <option value="EN_PROGRESO">En progreso</option>
              <option value="RESPONDIDO">Respondido</option>
              <option value="CERRADO">Cerrado</option>
            </select>
          </div>

          {/* Filtro por Prioridad */}
          <div>
            <select
              value={filtros.prioridad}
              onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todas las prioridades</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
          
          {/* Filtro por Entidad (Añadido) */}
          <div>
            <select
              value={filtros.entidad}
              onChange={(e) => setFiltros({ ...filtros, entidad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todas las entidades</option>
              {ALL_ENTITIES.map(entity => (
                <option key={entity.sigla} value={entity.sigla}>
                  {entity.nombre} ({entity.sigla})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Casos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {casosMostrados.length === 0 && !loading && !error ? (
          <div className="text-center py-12">
            <Mail className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron casos</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {casosMostrados.map((caso) => (
              <a // Se utiliza <a> en lugar de <Link> para evitar el error de compilación.
                key={caso.id}
                href={`/dashboard/bandeja/${caso.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Primera línea: Entidad y Prioridad */}
                    <div className="flex items-center space-x-3 mb-2 flex-wrap">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: caso.entidad.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                        {caso.entidad.sigla}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getPrioridadStyles(caso.prioridad)}`}>
                        {caso.prioridad}
                      </span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getEstadoStyles(caso.estado)}`}>
                        {getEstadoIcon(caso.estado)}
                        <span>{caso.estado.replace('_', ' ')}</span>
                      </span>
                    </div>

                    {/* Asunto */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {caso.asunto}
                    </h3>

                    {/* Descripción */}
                    {caso.descripcion && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {caso.descripcion}
                      </p>
                    )}

                    {/* Información inferior */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Mail size={14} />
                        <span>{new Date(caso.fechaRecepcion).toLocaleDateString('es-ES')}</span>
                      </div>

                      {caso.fechaVencimiento && (
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Calendar size={14} />
                          <span>Vence: {new Date(caso.fechaVencimiento).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}

                      {caso.responsable && (
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <User size={14} />
                          <span>{caso.responsable.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Acción rápida de menú contextual
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </a> // Se utiliza <a> en lugar de <Link> para evitar el error de compilación.
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
