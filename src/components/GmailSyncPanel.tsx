'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw, Play, StopCircle, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface SyncStatus {
  running: boolean;
  lastSync: string | null;
  emailsProcessed: number;
  error: string | null;
}

export default function GmailSyncPanel() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<SyncStatus>({
    running: false,
    lastSync: null,
    emailsProcessed: 0,
    error: null
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Verificar si el usuario es administrador
  const isAdmin = session?.user?.role && 
    ['ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES'].includes(session.user.role);

  const fetchStatus = async () => {
    if (!isAdmin) return;

    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          running: data.status === 'running',
          lastSync: data.lastSync || prev.lastSync
        }));
      }
    } catch (error) {
      console.error('Error obteniendo estado:', error);
    }
  };

  const handleStartService = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        setStatus(prev => ({ ...prev, running: true, error: null }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, error: 'Error iniciando servicio' }));
    } finally {
      setLoading(false);
    }
  };

  const handleStopService = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });

      if (response.ok) {
        setStatus(prev => ({ ...prev, running: false, error: null }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, error: 'Error deteniendo servicio' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/gmail/sync');
      const data = await response.json();

      if (data.success) {
        // Actualizar estado
        fetchStatus();
        
        // Mostrar mensaje de éxito
        alert('Sincronización iniciada correctamente');
      } else {
        setStatus(prev => ({ ...prev, error: data.error || 'Error en sincronización' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, error: 'Error de conexión' }));
    } finally {
      setSyncing(false);
    }
  };

  // Cargar estado inicial
  useEffect(() => {
    if (isAdmin) {
      fetchStatus();
      // Actualizar estado cada 30 segundos
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Mail className="text-blue-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sincronización de Gmail</h3>
            <p className="text-sm text-gray-600">Servicio de detección automática de correos</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status.running 
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status.running ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Información de estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Última sincronización</span>
          </div>
          <p className="text-lg font-semibold">
            {status.lastSync 
              ? new Date(status.lastSync).toLocaleTimeString('es-ES')
              : 'Nunca'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Mail size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Correos procesados</span>
          </div>
          <p className="text-lg font-semibold">{status.emailsProcessed}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            {status.error ? (
              <AlertCircle size={18} className="text-red-500" />
            ) : (
              <CheckCircle size={18} className="text-green-500" />
            )}
            <span className="text-sm font-medium text-gray-700">Estado</span>
          </div>
          <p className={`text-lg font-semibold ${status.error ? 'text-red-600' : 'text-green-600'}`}>
            {status.error ? 'Con errores' : 'Normal'}
          </p>
        </div>
      </div>

      {/* Mensaje de error */}
      {status.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-800">{status.error}</p>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSyncNow}
          disabled={syncing || !status.running}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`mr-2 ${syncing ? 'animate-spin' : ''}`} size={18} />
          {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>

        {status.running ? (
          <button
            onClick={handleStopService}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <StopCircle className="mr-2" size={18} />
            Detener servicio
          </button>
        ) : (
          <button
            onClick={handleStartService}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="mr-2" size={18} />
            Iniciar servicio
          </button>
        )}

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="mr-2" size={18} />
          Actualizar estado
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuración actual:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Intervalo de sincronización: 5 minutos</li>
          <li>• Máximo de emails por sincronización: 50</li>
          <li>• Carpeta monitoreada: INBOX</li>
          <li>• Notificaciones: Activadas para administradores</li>
        </ul>
      </div>
    </div>
  );
}