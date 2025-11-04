// src/app/dashboard/bandeja/[id]/page.tsx - VERSIÓN COMPLETA Y FUNCIONAL
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
  MessageSquare
} from 'lucide-react';

interface Caso {
  id: string;
  asunto: string;
  descripcion: string;
  prioridad: 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
  estado: string;
  etapaAprobacion: string;
  tipoSolicitud: string;
  fechaRecepcion: string;
  fechaVencimiento: string;
  entidad: {
    nombre: string;
    sigla: string;
    color: string;
    tiempoRespuestaDias: number;
  };
  responsable: {
    name: string;
    email: string;
    cargo?: string;
  };
  actividades: Array<{
    id: string;
    tipo: string;
    descripcion: string;
    fecha: string;
    usuario: {
      name: string;
      email: string;
    };
  }>;
}

export default function DetalleCasoPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const casoId = params.id as string;

  const [caso, setCaso] = useState<Caso | null>(null);
  const [loading, setLoading] = useState(true);
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
      try {
        const response = await fetch(`/api/casos/${casoId}`);
        
        if (!response.ok) {
          throw new Error('Error cargando caso');
        }
        
        const data = await response.json();
        setCaso(data);
        setFormData({
          descripcion: data.descripcion || '',
          prioridad: data.prioridad
        });
      } catch (error) {
        console.error('Error cargando caso:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarCaso();
  }, [casoId]);

  const handleGuardar = async () => {
    if (!caso) return;
    
    setGuardando(true);
    try {
      const response = await fetch(`/api/casos/${casoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error guardando caso');
      }

      const casoActualizado = await response.json();
      setCaso(casoActualizado);
      setEditando(false);
      
      // Agregar actividad de edición
      await fetch('/api/actividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'COMENTARIO',
          descripcion: 'Caso actualizado',
          casoId: casoId,
          usuarioId: session?.user?.id,
        }),
      });
      
    } catch (error) {
      console.error('Error guardando caso:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleEnviarRevision = async () => {
    if (!caso) return;
    
    try {
      const response = await fetch(`/api/casos/${casoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          etapaAprobacion: 'EN_REVISION',
          estado: 'EN_REVISION'
        }),
      });

      if (!response.ok) {
        throw new Error('Error enviando a revisión');
      }

      const casoActualizado = await response.json();
      setCaso(casoActualizado);
      
      // Agregar actividad de envío a revisión
      await fetch('/api/actividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'ENVIO_REVISION',
          descripcion: 'Caso enviado a revisión',
          casoId: casoId,
          usuarioId: session?.user?.id,
        }),
      });
      
      router.push('/dashboard/bandeja?message=Enviado a revisión exitosamente');
      
    } catch (error) {
      console.error('Error enviando a revisión:', error);
    }
  };

  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim() || !session?.user) return;

    try {
      const response = await fetch('/api/actividades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'COMENTARIO',
          descripcion: nuevoComentario,
          casoId: casoId,
          usuarioId: session.user.id,
        }),
      });

      if (response.ok) {
        setNuevoComentario('');
        // Recargar el caso para mostrar el nuevo comentario
        const responseCaso = await fetch(`/api/casos/${casoId}`);
        if (responseCaso.ok) {
          setCaso(await responseCaso.json());
        }
      }
    } catch (error) {
      console.error('Error agregando comentario:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando caso...</p>
        </div>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Caso no encontrado</h3>
        <button 
          onClick={() => router.push('/dashboard/bandeja')}
          className="text-blue-600 hover:text-blue-700"
        >
          Volver a la bandeja
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/bandeja')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle del Caso</h1>
            <p className="text-gray-600">ID: {caso.id}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          {editando ? (
            <>
              <button
                onClick={() => setEditando(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditando(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                onClick={handleEnviarRevision}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send size={16} />
                <span>Enviar a Revisión</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Información Básica */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Caso</h2>
            
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
                    style={{ backgroundColor: caso.entidad.color }}
                  ></div>
                  <span className="text-gray-900">{caso.entidad.nombre} ({caso.entidad.sigla})</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                {editando ? (
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({...formData, prioridad: e.target.value as any})}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="MUY_ALTA">Muy Alta</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    caso.prioridad === 'MUY_ALTA' ? 'bg-red-100 text-red-800' :
                    caso.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                    caso.prioridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {caso.prioridad.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solicitud</label>
                <p className="text-gray-900">{caso.tipoSolicitud.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h2>
            {editando ? (
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el caso..."
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{caso.descripcion}</p>
            )}
          </div>

          {/* Actividades y Comentarios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividades y Comentarios</h2>
            
            {/* Formulario para nuevo comentario */}
            <div className="mb-6">
              <textarea
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Agregar un comentario..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAgregarComentario}
                  disabled={!nuevoComentario.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={16} />
                  <span>Agregar Comentario</span>
                </button>
              </div>
            </div>

            {/* Lista de actividades */}
            <div className="space-y-4">
              {caso?.actividades?.map((actividad) => (
                <div key={actividad.id} className="flex space-x-3 border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="text-blue-600" size={16} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{actividad.usuario.name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(actividad.fecha).toLocaleString('es-ES')}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {actividad.tipo.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{actividad.descripcion}</p>
                  </div>
                </div>
              ))}
              
              {(!caso?.actividades || caso.actividades.length === 0) && (
                <p className="text-gray-500 text-center py-4">No hay actividades registradas</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Información de Estado */}
        <div className="space-y-6">
          {/* Estado del Workflow */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado del Proceso</h2>
            
            <div className="space-y-3">
              {['RECIBIDO', 'ASIGNADO', 'EN_REDACCIÓN', 'EN_REVISION', 'EN_APROBACION', 'FIRMA_LEGAL', 'LISTO_ENVIO', 'ENVIADO', 'CON_ACUSE'].map((etapa, index) => (
                <div key={etapa} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= ['RECIBIDO', 'ASIGNADO', 'EN_REDACCIÓN', 'EN_REVISION', 'EN_APROBACION'].indexOf(caso.etapaAprobacion) 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index <= ['RECIBIDO', 'ASIGNADO', 'EN_REDACCIÓN', 'EN_REVISION', 'EN_APROBACION'].indexOf(caso.etapaAprobacion) ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>
                  <span className={`text-sm ${
                    index <= ['RECIBIDO', 'ASIGNADO', 'EN_REDACCIÓN', 'EN_REVISION', 'EN_APROBACION'].indexOf(caso.etapaAprobacion)
                      ? 'text-green-700 font-medium'
                      : 'text-gray-500'
                  }`}>
                    {etapa.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Información de Fechas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fechas</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Recepción:</span>
                <span className="text-sm font-medium">
                  {new Date(caso.fechaRecepcion).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vencimiento:</span>
                <span className="text-sm font-medium text-red-600">
                  {new Date(caso.fechaVencimiento).toLocaleDateString('es-ES')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Días restantes:</span>
                <span className="text-sm font-medium">
                  {Math.ceil((new Date(caso.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días
                </span>
              </div>
            </div>
          </div>

          {/* Responsable */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Responsable</h2>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{caso.responsable.name}</p>
                <p className="text-sm text-gray-600">{caso.responsable.email}</p>
                {caso.responsable.cargo && (
                  <p className="text-sm text-gray-500">{caso.responsable.cargo}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}