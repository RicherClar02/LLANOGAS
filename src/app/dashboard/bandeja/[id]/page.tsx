//src/app/dashboard/bandeja/[id]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  CheckCircle, 
  Clock,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Edit,
  X
} from 'lucide-react';

interface CasoDetalle {
  id: string;
  asunto: string;
  descripcion: string | null;
  prioridad: 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
  estado: string;
  etapaAprobacion: string;
  tipoSolicitud: string | null;
  fechaRecepcion: string;
  fechaVencimiento: string | null;
  entidad: {
    nombre: string;
    sigla: string;
    color: string | null;
  };
  responsable: {
    name: string | null;
    email: string;
    cargo?: string | null;
  } | null;
  creador: {
    name: string | null;
    email: string;
  } | null;
  actividades: Array<{
    id: string;
    tipo: string;
    descripcion: string;
    fecha: string;
    usuario: {
      name: string | null;
      email: string;
    };
  }>;
}

export default function DetalleCasoPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const casoId = params.id as string;

  const [caso, setCaso] = useState<CasoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: '',
    prioridad: 'MEDIA' as 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA',
  });
  const [nuevoComentario, setNuevoComentario] = useState('');

  // Cargar datos del caso
  useEffect(() => {
    const cargarCaso = async () => {
      if (!casoId) {
        setError('ID de caso no válido');
        setLoading(false);
        return;
      }

      try {
        console.log('Cargando caso:', casoId);
        const response = await fetch(`/api/casos/${casoId}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        setCaso(data);
        setFormData({
          descripcion: data.descripcion || '',
          prioridad: data.prioridad
        });
      } catch (error) {
        console.error('Error cargando caso:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    cargarCaso();
  }, [casoId]);

  // Función para formatear estados
  const formatEstado = (estado: string) => {
    return estado ? estado.replace(/_/g, ' ') : 'Desconocido';
  };

  // Clases para prioridades
  const getPriorityClasses = (prioridad: string) => {
    switch (prioridad) {
      case 'MUY_ALTA': return 'bg-red-100 text-red-800';
      case 'ALTA': return 'bg-orange-100 text-orange-800';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800';
      case 'BAJA': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calcular días restantes
  const getDiasRestantes = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;
    try {
      const diffTime = new Date(fechaVencimiento).getTime() - Date.now();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando caso...</p>
        </div>
      </div>
    );
  }

  if (error || !caso) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">
            {error || 'No se pudo cargar el caso'}
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <p>ID del caso: {casoId}</p>
            <p>Verifica que el caso exista y tengas permisos.</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/bandeja')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver a la bandeja
          </button>
        </div>
      </div>
    );
  }

  const diasRestantes = getDiasRestantes(caso.fechaVencimiento);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/bandeja')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver a la bandeja
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{caso.asunto}</h1>
              <p className="text-gray-600 mt-1">ID: {caso.id}</p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {formatEstado(caso.estado)}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityClasses(caso.prioridad)}`}>
                {formatEstado(caso.prioridad)}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información básica */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Información del Caso</h2>
                <button
                  onClick={() => setEditando(!editando)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {editando ? <X size={16} /> : <Edit size={16} />}
                  <span>{editando ? 'Cancelar' : 'Editar'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                  <p className="text-gray-900 font-medium">{caso.asunto}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: caso.entidad.color || '#6B7280' }}
                    ></div>
                    <span className="text-gray-900">
                      {caso.entidad.nombre} ({caso.entidad.sigla})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  {editando ? (
                    <select
                      value={formData.prioridad}
                      onChange={(e) => setFormData({...formData, prioridad: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="MUY_ALTA">Muy Alta</option>
                      <option value="ALTA">Alta</option>
                      <option value="MEDIA">Media</option>
                      <option value="BAJA">Baja</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityClasses(caso.prioridad)}`}>
                      {formatEstado(caso.prioridad)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solicitud</label>
                  <p className="text-gray-900">
                    {caso.tipoSolicitud ? formatEstado(caso.tipoSolicitud) : 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h2>
              {editando ? (
                <div className="space-y-3">
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe el caso..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        // Aquí iría la lógica para guardar
                        setEditando(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save size={16} />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {caso.descripcion || 'No hay descripción disponible.'}
                </p>
              )}
            </div>

            {/* Actividades */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividades Recientes</h2>
              
              <div className="space-y-4">
                {caso.actividades && caso.actividades.length > 0 ? (
                  caso.actividades.map((actividad) => (
                    <div key={actividad.id} className="flex space-x-3 border-l-4 border-blue-500 pl-4 py-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="text-blue-600" size={16} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {actividad.usuario.name || actividad.usuario.email}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(actividad.fecha).toLocaleString('es-ES')}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {formatEstado(actividad.tipo)}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1">{actividad.descripcion}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay actividades registradas</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estado del workflow */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Caso</h2>
              
              <div className="space-y-3">
                {['RECIBIDO', 'ASIGNADO', 'EN_REDACCION', 'EN_REVISION', 'EN_APROBACION', 'FIRMA_LEGAL', 'LISTO_ENVIO', 'ENVIADO', 'CON_ACUSE'].map((etapa) => (
                  <div key={etapa} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      caso.etapaAprobacion === etapa 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {caso.etapaAprobacion === etapa && <CheckCircle size={12} />}
                    </div>
                    <span className={`text-sm ${
                      caso.etapaAprobacion === etapa 
                        ? 'text-green-700 font-medium' 
                        : 'text-gray-500'
                    }`}>
                      {formatEstado(etapa)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fechas importantes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fechas</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recepción:</span>
                  <span className="text-sm font-medium">
                    {new Date(caso.fechaRecepcion).toLocaleDateString('es-ES')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vencimiento:</span>
                  <span className={`text-sm font-medium ${
                    diasRestantes !== null && diasRestantes < 0 
                      ? 'text-red-600' 
                      : 'text-gray-900'
                  }`}>
                    {caso.fechaVencimiento 
                      ? new Date(caso.fechaVencimiento).toLocaleDateString('es-ES')
                      : 'No definido'
                    }
                  </span>
                </div>

                {diasRestantes !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Días restantes:</span>
                    <span className={`text-sm font-medium ${
                      diasRestantes < 0 ? 'text-red-600' :
                      diasRestantes <= 3 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {diasRestantes} días
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Responsable */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Responsable</h2>
              
              {caso.responsable ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {caso.responsable.name || 'Usuario sin nombre'}
                    </p>
                    <p className="text-sm text-gray-600">{caso.responsable.email}</p>
                    {caso.responsable.cargo && (
                      <p className="text-sm text-gray-500">{caso.responsable.cargo}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2">No asignado</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}