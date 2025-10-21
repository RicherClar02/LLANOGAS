// src/components/CrearCasoModal.tsx
// Modal para crear nuevos casos
'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface Entidad {
  id: string;
  nombre: string;
  sigla: string;
  color: string;
}

interface CrearCasoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCasoCreado: (caso: any) => void;
}

export default function CrearCasoModal({ isOpen, onClose, onCasoCreado }: CrearCasoModalProps) {
  const [loading, setLoading] = useState(false);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [formData, setFormData] = useState({
    asunto: '',
    descripcion: '',
    prioridad: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAJA',
    entidadId: '',
    fechaVencimiento: ''
  });

  // Cargar entidades al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarEntidades();
    }
  }, [isOpen]);

  const cargarEntidades = async () => {
    try {
      const response = await fetch('/api/entidades');
      if (response.ok) {
        const data = await response.json();
        setEntidades(data.entidades);
      }
    } catch (error) {
      console.error('Error al cargar entidades:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/casos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onCasoCreado(data.caso);
        onClose();
        resetForm();
      } else {
        alert('Error al crear el caso');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      asunto: '',
      descripcion: '',
      prioridad: 'MEDIA',
      entidadId: '',
      fechaVencimiento: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Caso</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asunto *
            </label>
            <input
              type="text"
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Reporte mensual de consumo - Enero 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada del caso..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entidad *
              </label>
              <select
                value={formData.entidadId}
                onChange={(e) => setFormData({ ...formData, entidadId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar entidad</option>
                {entidades.map((entidad) => (
                  <option key={entidad.id} value={entidad.id}>
                    {entidad.nombre} ({entidad.sigla})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.prioridad}
                onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={formData.fechaVencimiento}
              onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Footer con botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>{loading ? 'Creando...' : 'Crear Caso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}