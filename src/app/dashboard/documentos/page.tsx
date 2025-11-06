'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  MoreVertical,
  Folder,
  Clock,
  User,
  Plus,
  Eye,
  Trash2,
  Share2
} from 'lucide-react';

interface Documento {
  id: string;
  nombre: string;
  tipo: 'plantilla' | 'respuesta' | 'anexo' | 'oficio';
  formato: 'docx' | 'pdf' | 'xlsx' | 'pptx';
  tamaño: string;
  fechaCreacion: string;
  fechaModificacion: string;
  creadoPor: {
    name: string;
    email: string;
  };
  casoId?: string;
  entidad?: string;
  etiquetas: string[];
  url?: string;
}

export default function DocumentosPage() {
  const { data: session } = useSession();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    formato: 'todos',
    search: '',
  });
  const [subiendo, setSubiendo] = useState(false);

  // Cargar documentos
  useEffect(() => {
    const cargarDocumentos = async () => {
      try {
        // Simular carga de documentos
        const mockDocumentos: Documento[] = [
          {
            id: '1',
            nombre: 'Plantilla Respuesta SUI',
            tipo: 'plantilla',
            formato: 'docx',
            tamaño: '2.4 MB',
            fechaCreacion: '2024-01-10',
            fechaModificacion: '2024-01-15',
            creadoPor: {
              name: 'Ana García',
              email: 'ana.garcia@llanogas.com'
            },
            etiquetas: ['SUI', 'plantilla', 'respuesta']
          },
          {
            id: '2',
            nombre: 'Reporte Mensual Enero',
            tipo: 'respuesta',
            formato: 'pdf',
            tamaño: '5.1 MB',
            fechaCreacion: '2024-01-20',
            fechaModificacion: '2024-01-20',
            creadoPor: {
              name: 'Carlos López',
              email: 'carlos.lopez@llanogas.com'
            },
            casoId: 'SUI-2024-001',
            entidad: 'SUI',
            etiquetas: ['reporte', 'mensual', 'enero']
          },
          {
            id: '3',
            nombre: 'Oficio Solicitud Información',
            tipo: 'oficio',
            formato: 'docx',
            tamaño: '1.8 MB',
            fechaCreacion: '2024-01-18',
            fechaModificacion: '2024-01-19',
            creadoPor: {
              name: 'María Rodríguez',
              email: 'maria.rodriguez@llanogas.com'
            },
            etiquetas: ['oficio', 'solicitud', 'plantilla']
          },
          {
            id: '4',
            nombre: 'Anexos Técnicos Proyecto',
            tipo: 'anexo',
            formato: 'pdf',
            tamaño: '8.3 MB',
            fechaCreacion: '2024-01-22',
            fechaModificacion: '2024-01-22',
            creadoPor: {
              name: 'Pedro Martínez',
              email: 'pedro.martinez@llanogas.com'
            },
            casoId: 'SS-2024-015',
            entidad: 'Superservicios',
            etiquetas: ['anexo', 'técnico', 'proyecto']
          }
        ];
        
        setDocumentos(mockDocumentos);
      } catch (error) {
        console.error('Error cargando documentos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDocumentos();
  }, []);

  const handleSubirDocumento = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    try {
      // Simular subida de archivo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const nuevoDocumento: Documento = {
        id: Math.random().toString(36).substr(2, 9),
        nombre: file.name,
        tipo: 'anexo',
        formato: file.name.split('.').pop() as any || 'pdf',
        tamaño: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaModificacion: new Date().toISOString().split('T')[0],
        creadoPor: {
          name: session?.user?.name || 'Usuario',
          email: session?.user?.email || ''
        },
        etiquetas: ['nuevo', 'subido']
      };

      setDocumentos(prev => [nuevoDocumento, ...prev]);
      event.target.value = ''; // Reset input
    } catch (error) {
      console.error('Error subiendo documento:', error);
    } finally {
      setSubiendo(false);
    }
  };

  const getTipoStyles = (tipo: string) => {
    switch (tipo) {
      case 'plantilla':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'respuesta':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'oficio':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'anexo':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFormatoIcon = (formato: string) => {
    switch (formato) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'xlsx':
        return '📊';
      case 'pptx':
        return '📽️';
      default:
        return '📁';
    }
  };

  const documentosFiltrados = documentos.filter(doc => {
    const coincideBusqueda = 
      doc.nombre.toLowerCase().includes(filtros.search.toLowerCase()) ||
      doc.etiquetas.some(tag => tag.toLowerCase().includes(filtros.search.toLowerCase()));
    
    const coincideTipo = filtros.tipo === 'todos' || doc.tipo === filtros.tipo;
    const coincideFormato = filtros.formato === 'todos' || doc.formato === filtros.formato;
    
    return coincideBusqueda && coincideTipo && coincideFormato;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">
            {documentosFiltrados.length} {documentosFiltrados.length === 1 ? 'documento' : 'documentos'} encontrados
          </p>
        </div>

        <div className="flex space-x-3">
          {/* Botón Subir Documento */}
          <label className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload size={16} />
            <span>Subir Documento</span>
            <input
              type="file"
              className="hidden"
              onChange={handleSubirDocumento}
              accept=".pdf,.docx,.xlsx,.pptx,.txt"
              disabled={subiendo}
            />
          </label>

          <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus size={16} />
            <span>Nueva Plantilla</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar documentos, etiquetas..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los tipos</option>
              <option value="plantilla">Plantillas</option>
              <option value="respuesta">Respuestas</option>
              <option value="oficio">Oficios</option>
              <option value="anexo">Anexos</option>
            </select>
          </div>

          {/* Filtro por Formato */}
          <div>
            <select
              value={filtros.formato}
              onChange={(e) => setFiltros({ ...filtros, formato: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los formatos</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
              <option value="xlsx">Excel</option>
              <option value="pptx">PowerPoint</option>
            </select>
          </div>
        </div>
      </div>

      {/* Indicador de subida */}
      {subiendo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700 font-medium">Subiendo documento...</span>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {documentosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filtros.search ? 'No se encontraron documentos' : 'No hay documentos'}
            </h3>
            <p className="text-gray-600">
              {filtros.search ? 'Intenta con otros términos de búsqueda' : 'Comienza subiendo tu primer documento'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documentosFiltrados.map((documento) => (
              <div key={documento.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4 flex-1 min-w-0">
                    {/* Icono del documento */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {getFormatoIcon(documento.formato)}
                      </div>
                    </div>

                    {/* Información del documento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {documento.nombre}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTipoStyles(documento.tipo)}`}>
                          {documento.tipo}
                        </span>
                        <span className="text-sm text-gray-500">
                          {documento.formato.toUpperCase()} • {documento.tamaño}
                        </span>
                      </div>

                      {/* Metadatos */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3 flex-wrap">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>
                            Modificado: {new Date(documento.fechaModificacion).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{documento.creadoPor.name}</span>
                        </div>
                        {documento.casoId && (
                          <div className="flex items-center space-x-1">
                            <Folder size={14} />
                            <span className="text-blue-600">{documento.casoId}</span>
                          </div>
                        )}
                      </div>

                      {/* Etiquetas */}
                      <div className="flex flex-wrap gap-2">
                        {documento.etiquetas.map((etiqueta, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            #{etiqueta}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <button
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Vista previa"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Más opciones"
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

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documentos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{documentos.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Plantillas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {documentos.filter(d => d.tipo === 'plantilla').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Espacio Usado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">24.6 MB</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Folder className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Este Mes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Upload className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}