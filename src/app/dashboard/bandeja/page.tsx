'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  AlertTriangle, 
  Clock, 
  Mail, 
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

interface Email {
  id: string;
  messageId: string;
  asunto: string;
  remitente: string;
  entidad: string;
  prioridad: 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
  radicado: string | null;
  fecha: string;
  tieneCaso: boolean;
  caso: {
    id: string;
    estado: string;
    responsable: string;
    entidad: string;
    fechaVencimiento: string | null;
  } | null;
  procesado: boolean;
  clasificado: boolean;
}

interface EmailsResponse {
  emails: Email[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalEmails: number;
    totalPages: number;
  };
}

export default function BandejaPage() {
  const { data: session } = useSession();
  const [emailsData, setEmailsData] = useState<EmailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroRadicado, setFiltroRadicado] = useState<'todos' | 'con-radicado' | 'sin-radicado'>('todos');
  const pageSize = 10;

  const fetchEmails = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        pageSize: pageSize.toString(),
        search: searchQuery,
        ...(filtroEntidad && { entidad: filtroEntidad }),
        ...(filtroRadicado !== 'todos' && { 
          conRadicado: filtroRadicado === 'con-radicado' ? 'true' : 'false' 
        })
      });
      
      const response = await fetch(`/api/email?${params.toString()}`);
      
      if (response.ok) {
        const data: EmailsResponse = await response.json();
        setEmailsData(data);
      } else {
        console.error('Error fetching emails:', response.statusText);
        setEmailsData({
          emails: [],
          pagination: {
            currentPage: 1,
            pageSize: pageSize,
            totalEmails: 0,
            totalPages: 0
          }
        });
      }
    } catch (error) {
      console.error('Error al obtener emails:', error);
      setEmailsData({
        emails: [],
        pagination: {
          currentPage: 1,
          pageSize: pageSize,
          totalEmails: 0,
          totalPages: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filtroEntidad, filtroRadicado, session, pageSize]);

  // Procesar nuevos emails
  const procesarNuevosEmails = async () => {
    setProcesando(true);
    try {
      const response = await fetch('/api/email/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check' }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        // Recargar la lista
        fetchEmails();
      } else {
        throw new Error('Error procesando emails');
      }
    } catch (error) {
      console.error('Error procesando emails:', error);
      alert('❌ Error al procesar emails');
    } finally {
      setProcesando(false);
    }
  };

  // Ejecutar la carga al cambiar filtros o página
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmails();
  };

  const handlePageChange = (newPage: number) => {
    if (emailsData && newPage >= 1 && newPage <= emailsData.pagination.totalPages) {
      setPage(newPage);
    }
  };

  const handleLimpiarFiltros = () => {
    setSearchQuery('');
    setFiltroEntidad('');
    setFiltroRadicado('todos');
    setPage(1);
  };

  // Clases para prioridades
  const getPriorityClasses = (prioridad: string) => {
    switch (prioridad) {
      case 'MUY_ALTA': return 'bg-red-100 text-red-800 border-red-300';
      case 'ALTA': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'BAJA': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Clases para estados
  const getStatusClasses = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EN_REDACCION': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EN_REVISION': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ENVIADO': return 'bg-green-100 text-green-800 border-green-300';
      case 'CERRADO': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Entidades únicas para el filtro
  const entidadesUnicas = [...new Set(emailsData?.emails.map(e => e.entidad).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandeja de Correos</h1>
          <p className="text-gray-600">
            {emailsData?.pagination.totalEmails || 0} {emailsData?.pagination.totalEmails === 1 ? 'correo' : 'correos'} procesados
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={procesarNuevosEmails}
            disabled={procesando}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={procesando ? 'animate-spin' : ''} />
            <span>{procesando ? 'Procesando...' : 'Buscar Nuevos Correos'}</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por asunto, remitente, radicado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por Entidad */}
            <div>
              <select
                value={filtroEntidad}
                onChange={(e) => setFiltroEntidad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las entidades</option>
                {entidadesUnicas.map(entidad => (
                  <option key={entidad} value={entidad}>{entidad}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Radicado */}
            <div>
              <select
                value={filtroRadicado}
                onChange={(e) => setFiltroRadicado(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los correos</option>
                <option value="con-radicado">Con radicado</option>
                <option value="sin-radicado">Sin radicado</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Limpiar filtros
            </button>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Correos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Radicado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remitente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando correos...
                  </td>
                </tr>
              ) : emailsData?.emails.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    {searchQuery || filtroEntidad || filtroRadicado !== 'todos' 
                      ? 'No se encontraron correos que coincidan con los filtros.'
                      : 'No hay correos procesados. Haz clic en "Buscar Nuevos Correos".'
                    }
                  </td>
                </tr>
              ) : (
                emailsData?.emails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {email.radicado ? (
                        <span className="text-blue-600 font-mono">{email.radicado}</span>
                      ) : (
                        <span className="text-gray-400">Sin radicado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {email.entidad || 'No detectada'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="line-clamp-2">{email.asunto}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Mail size={14} className="text-gray-400" />
                        <span className="truncate max-w-[150px]">{email.remitente}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFecha(email.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityClasses(email.prioridad)}`}>
                        {email.prioridad.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {email.tieneCaso ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(email.caso!.estado)}`}>
                          {email.caso!.estado.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-800 border-gray-300">
                          Sin caso
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {email.tieneCaso ? (
                          <Link 
                            href={`/dashboard/bandeja/${email.caso!.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors flex items-center space-x-1"
                          >
                            <FileText size={14} />
                            <span>Ver caso</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => alert('Funcionalidad para crear caso desde este email')}
                            className="text-green-600 hover:text-green-900 transition-colors flex items-center space-x-1"
                          >
                            <Eye size={14} />
                            <span>Crear caso</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {emailsData && emailsData.pagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{(emailsData.pagination.currentPage - 1) * pageSize + 1}</span> a{' '}
            <span className="font-medium">{Math.min(emailsData.pagination.currentPage * pageSize, emailsData.pagination.totalEmails)}</span> de{' '}
            <span className="font-medium">{emailsData.pagination.totalEmails}</span> resultados
          </p>
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(emailsData.pagination.currentPage - 1)}
              disabled={emailsData.pagination.currentPage === 1}
              className={`p-2 border border-gray-300 rounded-lg ${
                emailsData.pagination.currentPage === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-lg">
              Página {emailsData.pagination.currentPage} de {emailsData.pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(emailsData.pagination.currentPage + 1)}
              disabled={emailsData.pagination.currentPage === emailsData.pagination.totalPages}
              className={`p-2 border border-gray-300 rounded-lg ${
                emailsData.pagination.currentPage === emailsData.pagination.totalPages 
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