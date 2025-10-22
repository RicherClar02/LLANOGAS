'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Plus,
  X,
} from 'lucide-react';

// === Tipos y Constantes ===

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

const ALL_ENTITIES = [
  { sigla: 'SUI', nombre: 'Superintendencia de Servicios Públicos', color: '#10b981' },
  { sigla: 'SS', nombre: 'Superservicios', color: '#3b82f6' },
  { sigla: 'MME', nombre: 'Ministerio de Minas y Energía', color: '#f59e0b' },
  { sigla: 'CREG', nombre: 'Comisión de Regulación', color: '#ef4444' },
];

// === Funciones Auxiliares ===

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

// === Componente Modal para Crear Caso ===
interface CrearCasoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCasoCreado: (nuevoCaso: Caso) => void;
}

const CrearCasoModal: React.FC<CrearCasoModalProps> = ({ isOpen, onClose, onCasoCreado }) => {
  const [formData, setFormData] = useState({
    asunto: '',
    descripcion: '',
    prioridad: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAJA',
    entidadSigla: ALL_ENTITIES[0].sigla,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const entidadSeleccionada = ALL_ENTITIES.find(e => e.sigla === formData.entidadSigla) || ALL_ENTITIES[0];

      const nuevoCasoMock: Caso = {
        id: crypto.randomUUID(),
        asunto: formData.asunto,
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        estado: 'PENDIENTE',
        entidad: entidadSeleccionada,
        fechaRecepcion: new Date().toISOString(),
      };
      
      onCasoCreado(nuevoCasoMock);
      onClose();
      setFormData({ 
        asunto: '', 
        descripcion: '', 
        prioridad: 'MEDIA', 
        entidadSigla: ALL_ENTITIES[0].sigla 
      });

    } catch (err) {
      setSubmitError('Error al guardar el caso. Intente nuevamente.');
      console.error('Error al crear caso:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <Plus size={20} className="text-blue-600" />
            <span>Crear Nuevo Caso</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-1">
              Asunto
            </label>
            <input
              type="text"
              id="asunto"
              name="asunto"
              value={formData.asunto}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900"
              placeholder="Escribe el asunto principal del caso"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900"
              placeholder="Detalla la situación o el problema"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900"
              >
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
            <div>
              <label htmlFor="entidadSigla" className="block text-sm font-medium text-gray-700 mb-1">
                Entidad
              </label>
              <select
                id="entidadSigla"
                name="entidadSigla"
                value={formData.entidadSigla}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900"
              >
                {ALL_ENTITIES.map(entity => (
                  <option key={entity.sigla} value={entity.sigla}>
                    {entity.nombre} ({entity.sigla})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 mt-2 flex items-center space-x-1">
              <AlertOctagon size={16} />
              <span>{submitError}</span>
            </p>
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.asunto}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Crear Caso</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// === Componente Principal: BandejaPage ===

export default function BandejaPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    prioridad: 'todos',
    entidad: 'todos',
    search: '',
  });
  const [modalAbierto, setModalAbierto] = useState(false);

  // Mock data inicial
  const mockCasos: Caso[] = [
    { 
      id: '1', 
      asunto: 'Falla en el servicio de acueducto', 
      descripcion: 'Reporte de baja presión en el barrio central desde hace 48 horas.', 
      prioridad: 'ALTA', 
      estado: 'PENDIENTE', 
      entidad: ALL_ENTITIES[0], 
      fechaRecepcion: '2025-10-20T10:00:00Z', 
      responsable: { name: 'Javier Pérez' }, 
      fechaVencimiento: '2025-10-27T10:00:00Z' 
    },
    { 
      id: '2', 
      asunto: 'Consulta sobre nueva regulación tarifaria', 
      descripcion: 'Solicitud de aclaración sobre el aumento en la factura de energía.', 
      prioridad: 'MEDIA', 
      estado: 'EN_PROGRESO', 
      entidad: ALL_ENTITIES[3], 
      fechaRecepcion: '2025-10-18T14:30:00Z', 
      responsable: { name: 'Ana Morales' } 
    },
    { 
      id: '3', 
      asunto: 'Reclamo por cobro excesivo de gas', 
      descripcion: 'El usuario alega que el consumo facturado no corresponde con la realidad.', 
      prioridad: 'BAJA', 
      estado: 'RESPONDIDO', 
      entidad: ALL_ENTITIES[1], 
      fechaRecepcion: '2025-10-15T09:15:00Z' 
    },
    { 
      id: '4', 
      asunto: 'Duda sobre el cambio de operador de telecomunicaciones', 
      descripcion: 'Petición para conocer los requisitos y procedimientos para el cambio.', 
      prioridad: 'MEDIA', 
      estado: 'CERRADO', 
      entidad: ALL_ENTITIES[2], 
      fechaRecepcion: '2025-10-10T11:00:00Z' 
    },
  ];

  // Orden de prioridad para el sorting
  const prioridadOrder = { ALTA: 3, MEDIA: 2, BAJA: 1 };

  const cargarCasos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      await new Promise(resolve => setTimeout(resolve, 500));

      const casosFiltrados = mockCasos.filter(caso =>
        (filtros.estado === 'todos' || caso.estado === filtros.estado) &&
        (filtros.prioridad === 'todos' || caso.prioridad === filtros.prioridad) &&
        (filtros.entidad === 'todos' || caso.entidad.sigla === filtros.entidad) &&
        (caso.asunto.toLowerCase().includes(filtros.search.toLowerCase()) || 
         (caso.descripcion?.toLowerCase().includes(filtros.search.toLowerCase()) ?? false))
      ).sort((a, b) => {
        return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
      });

      setCasos(casosFiltrados);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los casos.';
      setError(errorMessage);
      console.error('Error al cargar casos:', err);
      setCasos([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarCasos();
  }, [cargarCasos]);

  const handleCasoCreado = (nuevoCaso: Caso) => {
    setCasos(prev => [nuevoCaso, ...prev]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center ">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bandeja de Entrada</h1>
            <p className="text-gray-600">Gestiona todos los casos y reportes</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 "></div>
            <p className="text-gray-600">Cargando casos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center ">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandeja de Entrada</h1>
          <p className="text-gray-600">
            {casos.length} {casos.length === 1 ? 'caso' : 'casos'} encontrados
          </p>
        </div>

        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors placeholder-gray-400">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium "
          >
            <Plus size={16} />
            <span>Nuevo Caso</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-sm flex items-center space-x-3" role="alert">
          <AlertOctagon size={20} className="flex-shrink-0" />
          <span className="block sm:inline font-medium">Error de Carga: {error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar en asuntos, descripciones..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-900"
              />
            </div>
          </div>

          <div>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-900"
            >
              <option value="todos">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ASIGNADO">Asignado</option>
              <option value="EN_PROGRESO">En progreso</option>
              <option value="RESPONDIDO">Respondido</option>
              <option value="CERRADO">Cerrado</option>
            </select>
          </div>

          <div>
            <select
              value={filtros.prioridad}
              onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-900"
            >
              <option value="todos">Todas las prioridades</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div>
            <select
              value={filtros.entidad}
              onChange={(e) => setFiltros({ ...filtros, entidad: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-900"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {casos.length === 0 && !loading && !error ? (
          <div className="text-center py-12">
            <Mail className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron casos</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {casos.map((caso) => (
              <div
                key={caso.id}
                className="block p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
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

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {caso.asunto}
                    </h3>

                    {caso.descripcion && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {caso.descripcion}
                      </p>
                    )}

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

                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CrearCasoModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCasoCreado={handleCasoCreado}
      />
    </div>
  );
}