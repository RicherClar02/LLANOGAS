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
  Share2,
  X
} from 'lucide-react';

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  formato: string;
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
  esPlantilla: boolean;
}

interface Caso {
  id: string;
  radicado: string;
  entidadSigla: string;
}

export default function DocumentosPage() {
  const { data: session } = useSession();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    formato: 'todos',
    search: '',
  });

  const [nuevoDocumento, setNuevoDocumento] = useState({
    file: null as File | null,
    tipo: 'anexo',
    casoId: '',
    esPlantilla: false
  });

  // Cargar documentos reales
  useEffect(() => {
    cargarDocumentos();
    cargarCasos();
  }, []);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.tipo !== 'todos') params.append('tipo', filtros.tipo);
      if (filtros.search) params.append('search', filtros.search);

      const response = await fetch(`/api/documentos?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data);
      } else {
        console.error('Error cargando documentos');
        setDocumentos([]);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarCasos = async () => {
    try {
      const response = await fetch('/api/casos?pageSize=100');
      if (response.ok) {
        const data = await response.json();
        setCasos(data.casos || []);
      }
    } catch (error) {
      console.error('Error cargando casos:', error);
    }
  };

  // Recargar cuando cambien los filtros
  useEffect(() => {
    cargarDocumentos();
  }, [filtros]);

  const handleSubirDocumento = async () => {
    if (!nuevoDocumento.file) return;

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('file', nuevoDocumento.file);
      formData.append('tipo', nuevoDocumento.tipo);
      formData.append('esPlantilla', nuevoDocumento.esPlantilla.toString());
      if (nuevoDocumento.casoId) formData.append('casoId', nuevoDocumento.casoId);

      const response = await fetch('/api/documentos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setDocumentos(prev => [result.documento, ...prev]);
        setMostrarModal(false);
        resetFormulario();
        alert('Documento subido exitosamente');
      } else {
        const error = await response.json();
        console.error('Error subiendo documento:', error);
        alert(`Error al subir el documento: ${error.error}`);
      }
    } catch (error) {
      console.error('Error subiendo documento:', error);
      alert('Error al subir el documento');
    } finally {
      setSubiendo(false);
    }
  };

  const resetFormulario = () => {
    setNuevoDocumento({
      file: null,
      tipo: 'anexo',
      casoId: '',
      esPlantilla: false
    });
  };

  const handleDescargar = async (documento: Documento) => {
    try {
      const response = await fetch(`/api/documentos/descargar/${documento.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.nombre;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error descargando documento');
        alert('Error al descargar el documento');
      }
    } catch (error) {
      console.error('Error descargando documento:', error);
      alert('Error al descargar el documento');
    }
  };

  const handleVistaPrevia = (documento: Documento) => {
    // Abrir en nueva pestaña si tiene URL, sino mostrar alerta
    if (documento.url && documento.url.startsWith('http')) {
      window.open(documento.url, '_blank');
    } else {
      alert(`Vista previa de: ${documento.nombre}\n\nURL: ${documento.url || 'No disponible'}`);
    }
  };

  const handleEliminar = async (documento: Documento) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${documento.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documentos/${documento.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocumentos(prev => prev.filter(d => d.id !== documento.id));
        alert('Documento eliminado exitosamente');
      } else {
        // --- INICIO DE LA MEJORA ---
        
        // 1. Intentar leer el cuerpo del error como JSON
        let errorMessage = 'Error desconocido al eliminar el documento.';
        let errorData;
        
        try {
            // Asumimos que el backend devuelve { error: 'Mensaje' }
            errorData = await response.json(); 
            errorMessage = errorData.error || `Error ${response.status}: ${errorMessage}`;
        } catch (e) {
            // Si no es JSON, usamos el estado de la respuesta
            errorMessage = `Error ${response.status}. Por favor, revisa los logs del servidor.`; 
        }

        console.error('Error al eliminar documento:', response.status, errorData || errorMessage);
        alert(`❌ Falló la eliminación: ${errorMessage}`);
        // --- FIN DE LA MEJORA ---
      }
    } catch (error) {
      // Este bloque maneja errores de red, no errores de API 4xx/5xx
      console.error('Error de conexión/red:', error);
      alert('Error de conexión con el servidor. Intente de nuevo.');
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
      case 'doc':
        return '📝';
      case 'xlsx':
      case 'xls':
        return '📊';
      case 'pptx':
      case 'ppt':
        return '📽️';
      case 'txt':
        return '📃';
      default:
        return '📁';
    }
  };

  // Calcular estadísticas reales
  const totalDocumentos = documentos.length;
  const totalPlantillas = documentos.filter(d => d.esPlantilla).length;
  const espacioUsado = documentos.reduce((acc, doc) => {
    const tamañoNum = parseFloat(doc.tamaño);
    return acc + (isNaN(tamañoNum) ? 0 : tamañoNum);
  }, 0);
  
  const documentosEsteMes = documentos.filter(doc => {
    const docDate = new Date(doc.fechaCreacion);
    const now = new Date();
    return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
  }).length;

  if (loading && documentos.length === 0) {
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
            {documentos.length} {documentos.length === 1 ? 'documento' : 'documentos'} encontrados
          </p>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={() => setMostrarModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={16} />
            <span>Subir Documento</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar documentos, casos..."
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

          {/* Botón Limpiar */}
          <div>
            <button 
              onClick={() => setFiltros({ tipo: 'todos', formato: 'todos', search: '' })}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Modal para subir documento */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Subir Documento</h2>
              <button 
                onClick={() => { setMostrarModal(false); resetFormulario(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo *
                </label>
                <input
                  type="file"
                  onChange={(e) => setNuevoDocumento({
                    ...nuevoDocumento,
                    file: e.target.files?.[0] || null
                  })}
                  accept=".pdf,.docx,.xlsx,.pptx,.txt,.doc,.xls,.ppt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={nuevoDocumento.tipo}
                  onChange={(e) => setNuevoDocumento({
                    ...nuevoDocumento,
                    tipo: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="anexo">Anexo</option>
                  <option value="plantilla">Plantilla</option>
                  <option value="respuesta">Respuesta</option>
                  <option value="oficio">Oficio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asociar a Caso (Opcional)
                </label>
                <select
                  value={nuevoDocumento.casoId}
                  onChange={(e) => setNuevoDocumento({
                    ...nuevoDocumento,
                    casoId: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="">Seleccionar caso...</option>
                  {casos.map(caso => (
                    <option key={caso.id} value={caso.id}>
                      {caso.radicado} - {caso.entidadSigla}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="esPlantilla"
                  checked={nuevoDocumento.esPlantilla}
                  onChange={(e) => setNuevoDocumento({
                    ...nuevoDocumento,
                    esPlantilla: e.target.checked
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="esPlantilla" className="text-sm text-gray-700">
                  ¿Es una plantilla?
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => { setMostrarModal(false); resetFormulario(); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubirDocumento}
                disabled={!nuevoDocumento.file || subiendo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {subiendo ? 'Subiendo...' : 'Subir Documento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {documentos.length === 0 ? (
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
            {documentos.map((documento) => (
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
                          {documento.esPlantilla && ' (Plantilla)'}
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
                            Creado: {new Date(documento.fechaCreacion).toLocaleDateString('es-ES')}
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
                            {documento.entidad && (
                              <span className="text-gray-500">- {documento.entidad}</span>
                            )}
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
                      onClick={() => handleDescargar(documento)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleVistaPrevia(documento)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Vista previa"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEliminar(documento)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas reales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documentos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalDocumentos}</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalPlantillas}</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{espacioUsado.toFixed(1)} MB</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{documentosEsteMes}</p>
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