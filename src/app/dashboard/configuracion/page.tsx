'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Save, 
  Users, 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  Database,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Filter
} from 'lucide-react';

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  cargo?: string;
  proceso?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaCreacion: string;
  ultimoAcceso?: string;
}

interface Entidad {
  id: string;
  nombre: string;
  sigla: string;
  color: string;
  dominioCorreo: string;
  tiempoRespuestaDias: number;
  palabrasClave: string[];
  responsablePredeterminado?: string;
  estado: 'ACTIVA' | 'INACTIVA';
}

interface ParametroSistema {
  clave: string;
  valor: string;
  descripcion: string;
  tipo: 'texto' | 'numero' | 'booleano' | 'lista';
  categoria: 'notificaciones' | 'seguridad' | 'general' | 'correo';
}

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'entidades' | 'parametros' | 'general'>('usuarios');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados para usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editandoUsuario, setEditandoUsuario] = useState<string | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState<Partial<Usuario>>({
    estado: 'ACTIVO'
  });
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);

  // Estados para entidades
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [editandoEntidad, setEditandoEntidad] = useState<string | null>(null);
  const [nuevaEntidad, setNuevaEntidad] = useState<Partial<Entidad>>({
    estado: 'ACTIVA',
    color: '#3B82F6',
    tiempoRespuestaDias: 15
  });
  const [mostrarFormEntidad, setMostrarFormEntidad] = useState(false);

  // Estados para parámetros
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [parametrosEditados, setParametrosEditados] = useState<Record<string, string>>({});

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Simular carga de datos
        const mockUsuarios: Usuario[] = [
          {
            id: '1',
            name: 'Ana García',
            email: 'ana.garcia@llanogas.com',
            role: 'ADMINISTRADOR_SISTEMA',
            cargo: 'Coordinadora TI',
            proceso: 'Tecnología',
            estado: 'ACTIVO',
            fechaCreacion: '2024-01-01',
            ultimoAcceso: '2024-01-20'
          },
          {
            id: '2',
            name: 'Carlos López',
            email: 'carlos.lopez@llanogas.com',
            role: 'GESTOR',
            cargo: 'Analista Jurídico',
            proceso: 'Jurídica',
            estado: 'ACTIVO',
            fechaCreacion: '2024-01-05',
            ultimoAcceso: '2024-01-20'
          },
          {
            id: '3',
            name: 'María Rodríguez',
            email: 'maria.rodriguez@llanogas.com',
            role: 'REVISOR_JURIDICO',
            cargo: 'Abogada Senior',
            proceso: 'Jurídica',
            estado: 'ACTIVO',
            fechaCreacion: '2024-01-10',
            ultimoAcceso: '2024-01-19'
          }
        ];

        const mockEntidades: Entidad[] = [
          {
            id: '1',
            nombre: 'Superintendencia de Servicios Públicos',
            sigla: 'SUI',
            color: '#EF4444',
            dominioCorreo: 'superservicios.gov.co',
            tiempoRespuestaDias: 10,
            palabrasClave: ['superintendencia', 'servicios', 'públicos', 'sui'],
            estado: 'ACTIVA'
          },
          {
            id: '2',
            nombre: 'Ministerio de Minas y Energía',
            sigla: 'MME',
            color: '#10B981',
            dominioCorreo: 'minminas.gov.co',
            tiempoRespuestaDias: 15,
            palabrasClave: ['ministerio', 'minas', 'energía', 'mme'],
            estado: 'ACTIVA'
          },
          {
            id: '3',
            nombre: 'Unidad de Planeación Minero Energética',
            sigla: 'UPME',
            color: '#8B5CF6',
            dominioCorreo: 'upme.gov.co',
            tiempoRespuestaDias: 20,
            palabrasClave: ['upme', 'planeación', 'minero', 'energética'],
            estado: 'ACTIVA'
          }
        ];

        const mockParametros: ParametroSistema[] = [
          {
            clave: 'NOTIFICACIONES_AVISO_VENCIMIENTO',
            valor: '3',
            descripcion: 'Días de anticipación para aviso de vencimiento',
            tipo: 'numero',
            categoria: 'notificaciones'
          },
          {
            clave: 'NOTIFICACIONES_DIARIAS_VENCIDOS',
            valor: 'true',
            descripcion: 'Enviar notificaciones diarias para casos vencidos',
            tipo: 'booleano',
            categoria: 'notificaciones'
          },
          {
            clave: 'SEGURIDAD_INTENTOS_LOGIN',
            valor: '5',
            descripcion: 'Número máximo de intentos de login fallidos',
            tipo: 'numero',
            categoria: 'seguridad'
          },
          {
            clave: 'CORREO_SERVIDOR_SMTP',
            valor: 'smtp.gmail.com',
            descripcion: 'Servidor SMTP para envío de correos',
            tipo: 'texto',
            categoria: 'correo'
          },
          {
            clave: 'GENERAL_IDIOMA',
            valor: 'es',
            descripcion: 'Idioma del sistema',
            tipo: 'lista',
            categoria: 'general'
          }
        ];

        setUsuarios(mockUsuarios);
        setEntidades(mockEntidades);
        setParametros(mockParametros);
      } catch (error) {
        console.error('Error cargando configuración:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Funciones para usuarios
  const guardarUsuario = async (usuario: Partial<Usuario>) => {
    setGuardando(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editandoUsuario) {
        setUsuarios(prev => prev.map(u => 
          u.id === editandoUsuario ? { ...u, ...usuario } as Usuario : u
        ));
        setEditandoUsuario(null);
      } else {
        const nuevo: Usuario = {
          id: Math.random().toString(36).substr(2, 9),
          name: usuario.name || '',
          email: usuario.email || '',
          role: usuario.role || 'GESTOR',
          cargo: usuario.cargo,
          proceso: usuario.proceso,
          estado: usuario.estado || 'ACTIVO',
          fechaCreacion: new Date().toISOString().split('T')[0]
        };
        setUsuarios(prev => [...prev, nuevo]);
        setMostrarFormUsuario(false);
      }
      
      setNuevoUsuario({ estado: 'ACTIVO' });
    } catch (error) {
      console.error('Error guardando usuario:', error);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarUsuario = (id: string) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  // Funciones para entidades
  const guardarEntidad = async (entidad: Partial<Entidad>) => {
    setGuardando(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editandoEntidad) {
        setEntidades(prev => prev.map(e => 
          e.id === editandoEntidad ? { ...e, ...entidad } as Entidad : e
        ));
        setEditandoEntidad(null);
      } else {
        const nueva: Entidad = {
          id: Math.random().toString(36).substr(2, 9),
          nombre: entidad.nombre || '',
          sigla: entidad.sigla || '',
          color: entidad.color || '#3B82F6',
          dominioCorreo: entidad.dominioCorreo || '',
          tiempoRespuestaDias: entidad.tiempoRespuestaDias || 15,
          palabrasClave: entidad.palabrasClave || [],
          estado: entidad.estado || 'ACTIVA'
        };
        setEntidades(prev => [...prev, nueva]);
        setMostrarFormEntidad(false);
      }
      
      setNuevaEntidad({ 
        estado: 'ACTIVA', 
        color: '#3B82F6', 
        tiempoRespuestaDias: 15 
      });
    } catch (error) {
      console.error('Error guardando entidad:', error);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarEntidad = (id: string) => {
    setEntidades(prev => prev.filter(e => e.id !== id));
  };

  // Funciones para parámetros
  const actualizarParametro = (clave: string, valor: string) => {
    setParametrosEditados(prev => ({ ...prev, [clave]: valor }));
  };

  const guardarParametros = async () => {
    setGuardando(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setParametros(prev => prev.map(p => 
        parametrosEditados[p.clave] !== undefined 
          ? { ...p, valor: parametrosEditados[p.clave] } 
          : p
      ));
      
      setParametrosEditados({});
    } catch (error) {
      console.error('Error guardando parámetros:', error);
    } finally {
      setGuardando(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMINISTRADOR_SISTEMA':
        return 'bg-red-100 text-red-800';
      case 'ADMINISTRADOR_ASIGNACIONES':
        return 'bg-blue-100 text-blue-800';
      case 'GESTOR':
        return 'bg-green-100 text-green-800';
      case 'REVISOR_JURIDICO':
        return 'bg-purple-100 text-purple-800';
      case 'APROBADOR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Administra usuarios, entidades y parámetros del sistema</p>
        </div>

        {guardando && (
          <div className="flex items-center space-x-2 text-blue-600">
            <RefreshCw className="animate-spin" size={20} />
            <span>Guardando...</span>
          </div>
        )}
      </div>

      {/* Tabs de Navegación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'usuarios', name: 'Usuarios', icon: Users },
              { id: 'entidades', name: 'Entidades', icon: Shield },
              { id: 'parametros', name: 'Parámetros', icon: Settings },
              { id: 'general', name: 'General', icon: Database }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de las Tabs */}
        <div className="p-6">
          {/* Tab: Usuarios */}
          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h2>
                <button
                  onClick={() => setMostrarFormUsuario(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Nuevo Usuario</span>
                </button>
              </div>

              {/* Formulario de Usuario */}
              {mostrarFormUsuario && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editandoUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={nuevoUsuario.name || ''}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Ana García"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={nuevoUsuario.email || ''}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: ana.garcia@llanogas.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol
                      </label>
                      <select
                        value={nuevoUsuario.role || ''}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar rol</option>
                        <option value="ADMINISTRADOR_SISTEMA">Administrador Sistema</option>
                        <option value="ADMINISTRADOR_ASIGNACIONES">Administrador Asignaciones</option>
                        <option value="GESTOR">Gestor</option>
                        <option value="REVISOR_JURIDICO">Revisor Jurídico</option>
                        <option value="APROBADOR">Aprobador</option>
                        <option value="ROL_SEGUIMIENTO">Rol Seguimiento</option>
                        <option value="AUDITOR">Auditor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo
                      </label>
                      <input
                        type="text"
                        value={nuevoUsuario.cargo || ''}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, cargo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Analista Jurídico"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proceso
                      </label>
                      <input
                        type="text"
                        value={nuevoUsuario.proceso || ''}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, proceso: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Jurídica"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={nuevoUsuario.estado || 'ACTIVO'}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, estado: e.target.value as 'ACTIVO' | 'INACTIVO' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setMostrarFormUsuario(false);
                        setEditandoUsuario(null);
                        setNuevoUsuario({ estado: 'ACTIVO' });
                      }}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => guardarUsuario(nuevoUsuario)}
                      disabled={guardando || !nuevoUsuario.name || !nuevoUsuario.email || !nuevoUsuario.role}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Usuarios */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Acceso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {usuario.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {usuario.email}
                              </div>
                              {usuario.cargo && (
                                <div className="text-xs text-gray-400">
                                  {usuario.cargo} • {usuario.proceso}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(usuario.role)}`}>
                              {usuario.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              usuario.estado === 'ACTIVO' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {usuario.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usuario.ultimoAcceso 
                              ? new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES')
                              : 'Nunca'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditandoUsuario(usuario.id);
                                  setNuevoUsuario(usuario);
                                  setMostrarFormUsuario(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => eliminarUsuario(usuario.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Entidades */}
          {activeTab === 'entidades' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Entidades</h2>
                <button
                  onClick={() => setMostrarFormEntidad(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Nueva Entidad</span>
                </button>
              </div>

              {/* Formulario de Entidad */}
              {mostrarFormEntidad && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editandoEntidad ? 'Editar Entidad' : 'Nueva Entidad'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la Entidad
                      </label>
                      <input
                        type="text"
                        value={nuevaEntidad.nombre || ''}
                        onChange={(e) => setNuevaEntidad({ ...nuevaEntidad, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Superintendencia de Servicios Públicos"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sigla
                      </label>
                      <input
                        type="text"
                        value={nuevaEntidad.sigla || ''}
                        onChange={(e) => setNuevaEntidad({ ...nuevaEntidad, sigla: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: SUI"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color Identificador
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={nuevaEntidad.color || '#3B82F6'}
                          onChange={(e) => setNuevaEntidad({ ...nuevaEntidad, color: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={nuevaEntidad.color || '#3B82F6'}
                          onChange={(e) => setNuevaEntidad({ ...nuevaEntidad, color: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dominio de Correo
                      </label>
                      <input
                        type="text"
                        value={nuevaEntidad.dominioCorreo || ''}
                        onChange={(e) => setNuevaEntidad({ ...nuevaEntidad, dominioCorreo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: superservicios.gov.co"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiempo de Respuesta (días)
                      </label>
                      <input
                        type="number"
                        value={nuevaEntidad.tiempoRespuestaDias || 15}
                        onChange={(e) => setNuevaEntidad({ ...nuevaEntidad, tiempoRespuestaDias: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="90"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={nuevaEntidad.estado || 'ACTIVA'}
                        onChange={(e) => setNuevaEntidad({ ...nuevaEntidad, estado: e.target.value as 'ACTIVA' | 'INACTIVA' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ACTIVA">Activa</option>
                        <option value="INACTIVA">Inactiva</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setMostrarFormEntidad(false);
                        setEditandoEntidad(null);
                        setNuevaEntidad({ 
                          estado: 'ACTIVA', 
                          color: '#3B82F6', 
                          tiempoRespuestaDias: 15 
                        });
                      }}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => guardarEntidad(nuevaEntidad)}
                      disabled={guardando || !nuevaEntidad.nombre || !nuevaEntidad.sigla || !nuevaEntidad.dominioCorreo}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Entidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entidades.map((entidad) => (
                  <div key={entidad.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: entidad.color }}
                        ></div>
                        <h3 className="font-semibold text-gray-900">{entidad.sigla}</h3>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entidad.estado === 'ACTIVA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entidad.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{entidad.nombre}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Dominio: {entidad.dominioCorreo}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{entidad.tiempoRespuestaDias} días de respuesta</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditandoEntidad(entidad.id);
                            setNuevaEntidad(entidad);
                            setMostrarFormEntidad(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => eliminarEntidad(entidad.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Parámetros */}
          {activeTab === 'parametros' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Parámetros del Sistema</h2>
                <button
                  onClick={guardarParametros}
                  disabled={guardando || Object.keys(parametrosEditados).length === 0}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save size={16} />
                  <span>Guardar Cambios</span>
                </button>
              </div>

              {/* Parámetros por Categoría */}
              {['notificaciones', 'seguridad', 'correo', 'general'].map((categoria) => {
                const parametrosCategoria = parametros.filter(p => p.categoria === categoria);
                
                if (parametrosCategoria.length === 0) return null;

                return (
                  <div key={categoria} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {categoria === 'notificaciones' && 'Configuración de Notificaciones'}
                        {categoria === 'seguridad' && 'Configuración de Seguridad'}
                        {categoria === 'correo' && 'Configuración de Correo'}
                        {categoria === 'general' && 'Configuración General'}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {parametrosCategoria.map((parametro) => (
                        <div key={parametro.clave} className="px-6 py-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-900 mb-1">
                                {parametro.descripcion}
                              </label>
                              <p className="text-sm text-gray-500 mb-3">
                                Clave: <code className="bg-gray-100 px-1 py-0.5 rounded">{parametro.clave}</code>
                              </p>
                              
                              {parametro.tipo === 'booleano' ? (
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => actualizarParametro(
                                      parametro.clave, 
                                      parametrosEditados[parametro.clave] === 'true' ? 'false' : 'true'
                                    )}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                      (parametrosEditados[parametro.clave] !== undefined 
                                        ? parametrosEditados[parametro.clave] 
                                        : parametro.valor) === 'true'
                                        ? 'bg-blue-600'
                                        : 'bg-gray-200'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        (parametrosEditados[parametro.clave] !== undefined 
                                          ? parametrosEditados[parametro.clave] 
                                          : parametro.valor) === 'true'
                                          ? 'translate-x-6'
                                          : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                  <span className="text-sm text-gray-600">
                                    {(parametrosEditados[parametro.clave] !== undefined 
                                      ? parametrosEditados[parametro.clave] 
                                      : parametro.valor) === 'true' ? 'Activado' : 'Desactivado'}
                                  </span>
                                </div>
                              ) : parametro.tipo === 'lista' ? (
                                <select
                                  value={parametrosEditados[parametro.clave] !== undefined 
                                    ? parametrosEditados[parametro.clave] 
                                    : parametro.valor
                                  }
                                  onChange={(e) => actualizarParametro(parametro.clave, e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="es">Español</option>
                                  <option value="en">Inglés</option>
                                </select>
                              ) : (
                                <input
                                  type={parametro.tipo === 'numero' ? 'number' : 'text'}
                                  value={parametrosEditados[parametro.clave] !== undefined 
                                    ? parametrosEditados[parametro.clave] 
                                    : parametro.valor
                                  }
                                  onChange={(e) => actualizarParametro(parametro.clave, e.target.value)}
                                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              )}
                            </div>
                            
                            {(parametrosEditados[parametro.clave] !== undefined) && (
                              <div className="ml-4 flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Sin guardar
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: General */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Información General del Sistema</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Estadísticas del Sistema</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Usuarios:</span>
                      <span className="font-medium">{usuarios.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Entidades:</span>
                      <span className="font-medium">{entidades.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usuarios Activos:</span>
                      <span className="font-medium">
                        {usuarios.filter(u => u.estado === 'ACTIVO').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entidades Activas:</span>
                      <span className="font-medium">
                        {entidades.filter(e => e.estado === 'ACTIVA').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Database className="text-blue-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Respaldar Base de Datos</p>
                          <p className="text-sm text-gray-600">Crear respaldo completo del sistema</p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="text-green-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Limpiar Cache</p>
                          <p className="text-sm text-gray-600">Eliminar cache temporal del sistema</p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Shield className="text-red-600" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Registros de Auditoría</p>
                          <p className="text-sm text-gray-600">Ver logs del sistema</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Información de la Instalación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Versión:</span>
                    <p className="font-medium">1.0.0</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Última Actualización:</span>
                    <p className="font-medium">20/01/2024</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Operativo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}