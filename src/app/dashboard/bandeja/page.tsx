// src/app/dashboard/bandeja/page.tsx - VERSIÓN CON DATOS REALES
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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
  Plus
} from 'lucide-react';



interface Caso {
  id: string;
  asunto: string;
  descripcion?: string;
  prioridad: 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
  estado: string;
  fechaRecepcion: string;
  fechaVencimiento?: string;
  entidad: {
    nombre: string;
    sigla: string;
    color: string;
  };
  responsable?: {
    name: string;
    email: string;
  };
  _count: {
    documentos: number;
    actividades: number;
  };
}

export default function BandejaPage() {
  const { data: session } = useSession();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    prioridad: 'todos',
    entidad: 'todos',
    search: '',
  });

  // Cargar casos reales
  const cargarCasos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filtros.estado !== 'todos') params.append('estado', filtros.estado);
      if (filtros.prioridad !== 'todos') params.append('prioridad', filtros.prioridad);
      if (filtros.entidad !== 'todos') params.append('entidad', filtros.entidad);
      if (filtros.search) params.append('search', filtros.search);

      const response = await fetch(`/api/casos?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar casos');
      }

      const data = await response.json();
      setCasos(data.casos || []);
    } catch (err) {
      setError('Error al cargar los casos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCasos();
  }, [filtros]);

  const getPrioridadStyles = (prioridad: string) => {
    switch (prioridad) {
      case 'MUY_ALTA':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJA':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-gray-100 text-gray-800';
      case 'ASIGNADO':
        return 'bg-blue-100 text-blue-800';
      case 'EN_REDACCIÓN':
        return 'bg-yellow-100 text-yellow-800';
      case 'EN_REVISION':
        return 'bg-purple-100 text-purple-800';
      case 'EN_APROBACION':
        return 'bg-indigo-100 text-indigo-800';
      case 'FIRMA_LEGAL':
        return 'bg-pink-100 text-pink-800';
      case 'LISTO_ENVIO':
        return 'bg-teal-100 text-teal-800';
      case 'ENVIADO':
        return 'bg-green-100 text-green-800';
      case 'CON_ACUSE':
        return 'bg-emerald-100 text-emerald-800';
      case 'CERRADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Clock size={16} />;
      case 'ASIGNADO':
        return <User size={16} />;
      case 'EN_REDACCIÓN':
        return <Mail size={16} />;
      case 'EN_REVISION':
        return <AlertTriangle size={16} />;
      case 'ENVIADO':
      case 'CON_ACUSE':
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
            {casos.length} {casos.length === 1 ? 'caso' : 'casos'} encontrados
          </p>
        </div>

        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={16} />
            <span>Nuevo Caso</span>
          </button>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-sm flex items-center space-x-3" role="alert">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <span className="block sm:inline font-medium">{error}</span>
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
              <option value="EN_REDACCIÓN">En redacción</option>
              <option value="EN_REVISION">En revisión</option>
              <option value="EN_APROBACION">En aprobación</option>
              <option value="FIRMA_LEGAL">Firma legal</option>
              <option value="LISTO_ENVIO">Listo para envío</option>
              <option value="ENVIADO">Enviado</option>
              <option value="CON_ACUSE">Con acuse</option>
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
              <option value="MUY_ALTA">Muy Alta</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          {/* Filtro por Entidad */}
          <div>
            <select
              value={filtros.entidad}
              onChange={(e) => setFiltros({ ...filtros, entidad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todas las entidades</option>
              <option value="SUI">SUI</option>
              <option value="SS">Superservicios</option>
              <option value="MME">Ministerio de Minas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Casos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {casos.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron casos</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {casos.map((caso) => (
              <Link
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
                        {caso.prioridad.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getEstadoStyles(caso.estado)}`}>
                        {getEstadoIcon(caso.estado)}
                        <span>{caso.estado.replace(/_/g, ' ')}</span>
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

                      {/* Contadores */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        {caso._count.actividades > 0 && (
                          <span className="flex items-center space-x-1">
                            <Mail size={14} />
                            <span>{caso._count.actividades} actividades</span>
                          </span>
                        )}
                        {caso._count.documentos > 0 && (
                          <span className="flex items-center space-x-1">
                            <AlertTriangle size={14} />
                            <span>{caso._count.documentos} documentos</span>
                          </span>
                        )}
                      </div>
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
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}