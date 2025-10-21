// src/app/dashboard/bandeja/[id]/page.tsx
// Página de detalle de un caso específico
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Mail,
  Clock,
  CheckCircle,
  Edit,
  Paperclip,
  MessageSquare
} from 'lucide-react';

// Datos de ejemplo para el caso
const mockCasoDetalle = {
  id: '1',
  asunto: 'Reporte mensual de consumo - Enero 2024',
  descripcion: 'Solicitud de reporte mensual de consumo de gas natural para el mes de enero 2024. Se requiere información detallada de consumo por cliente, sector y tipo de servicio.',
  prioridad: 'ALTA',
  estado: 'PENDIENTE',
  entidad: { 
    nombre: 'Superintendencia de Servicios Públicos', 
    sigla: 'SUI', 
    color: '#3B82F6',
    email: 'sui@superservicios.gov.co'
  },
  responsable: { 
    id: '2', 
    name: 'Ana García',
    email: 'ana.garcia@llanogas.com'
  },
  fechaRecepcion: '2024-01-15T10:30:00Z',
  fechaVencimiento: '2024-01-25T23:59:00Z',
  actividades: [
    {
      id: '1',
      tipo: 'CREACION',
      descripcion: 'Caso creado automáticamente desde correo electrónico',
      fecha: '2024-01-15T10:30:00Z',
      usuario: { name: 'Sistema' }
    },
    {
      id: '2',
      tipo: 'ASIGNACION',
      descripcion: 'Caso asignado a Ana García',
      fecha: '2024-01-15T11:15:00Z',
      usuario: { name: 'Admin Sistema' }
    }
  ],
  documentos: [
    {
      id: '1',
      nombre: 'solicitud-reporte-enero.pdf',
      tipo: 'application/pdf',
      tamaño: 245760,
      fecha: '2024-01-15T10:30:00Z'
    }
  ]
};

export default function CasoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCaso(mockCasoDetalle);
      setLoading(false);
    }, 1000);
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando caso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Caso no encontrado</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">El caso solicitado no existe o no tienes acceso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{caso.asunto}</h1>
            <p className="text-gray-600">Detalles del caso #{caso.id}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Edit size={16} />
            <span>Editar</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Cambiar Estado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal - Información del caso */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de información básica */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Caso</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Entidad</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: caso.entidad.color }}
                  ></div>
                  <p className="text-gray-900">{caso.entidad.nombre} ({caso.entidad.sigla})</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Prioridad</label>
                <p className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  caso.prioridad === 'ALTA' ? 'bg-red-100 text-red-800' :
                  caso.prioridad === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {caso.prioridad}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <p className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  caso.estado === 'PENDIENTE' ? 'bg-gray-100 text-gray-800' :
                  caso.estado === 'ASIGNADO' ? 'bg-blue-100 text-blue-800' :
                  caso.estado === 'EN_PROGRESO' ? 'bg-yellow-100 text-yellow-800' :
                  caso.estado === 'RESPONDIDO' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {caso.estado === 'PENDIENTE' && <Clock size={14} />}
                  {caso.estado === 'ASIGNADO' && <User size={14} />}
                  {caso.estado === 'EN_PROGRESO' && <Clock size={14} />}
                  {caso.estado === 'RESPONDIDO' && <CheckCircle size={14} />}
                  <span>{caso.estado.replace('_', ' ')}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Responsable</label>
                <div className="flex items-center space-x-2 mt-1">
                  <User size={16} className="text-gray-400" />
                  <p className="text-gray-900">{caso.responsable?.name || 'Sin asignar'}</p>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <p className="text-gray-600 mt-1 leading-relaxed">{caso.descripcion}</p>
            </div>
          </div>

          {/* Historial de actividades */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Actividades</h2>
            
            <div className="space-y-4">
              {caso.actividades.map((actividad: any) => (
                <div key={actividad.id} className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-gray-900">{actividad.descripcion}</p>
                    <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                      <span>{actividad.usuario.name}</span>
                      <span>•</span>
                      <span>{new Date(actividad.fecha).toLocaleString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna lateral - Metadatos y acciones */}
        <div className="space-y-6">
          {/* Fechas importantes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fechas</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Recibido</span>
                </div>
                <span className="text-sm text-gray-900">
                  {new Date(caso.fechaRecepcion).toLocaleDateString('es-ES')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Vencimiento</span>
                </div>
                <span className="text-sm text-gray-900">
                  {new Date(caso.fechaVencimiento).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          {/* Documentos adjuntos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h2>
            
            <div className="space-y-3">
              {caso.documentos.map((documento: any) => (
                <div key={documento.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Paperclip size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{documento.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {(documento.tamaño / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Descargar
                  </button>
                </div>
              ))}
              
              <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center space-y-2">
                  <Paperclip size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Agregar documento</span>
                </div>
              </button>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
            
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors justify-center">
                <MessageSquare size={16} />
                <span>Agregar Comentario</span>
              </button>
              
              <button className="w-full flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors justify-center">
                <User size={16} />
                <span>Asignar Responsable</span>
              </button>
              
              <button className="w-full flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors justify-center">
                <Calendar size={16} />
                <span>Cambiar Fecha</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}