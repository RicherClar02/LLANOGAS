'use client';

import { useState } from 'react';
import { Calendar, Filter, Plus, Clock, AlertTriangle } from 'lucide-react';

interface Evento {
  id: string;
  title: string;
  date: string;
  type: 'vencimiento' | 'revision' | 'aprobacion';
  casoId: string;
  entidad: string;
  prioridad: 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
}

export default function CalendarioPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [vista, setVista] = useState<'mes' | 'semana' | 'dia'>('mes');

  const eventos: Evento[] = [
    {
      id: '1',
      title: 'Vencimiento - Reporte SUI',
      date: '2024-01-20',
      type: 'vencimiento',
      casoId: 'SUI-2024-001',
      entidad: 'SUI',
      prioridad: 'ALTA'
    },
    {
      id: '2',
      title: 'Revisión Legal',
      date: '2024-01-18',
      type: 'revision',
      casoId: 'SS-2024-015',
      entidad: 'Superservicios',
      prioridad: 'MUY_ALTA'
    }
  ];

  const getEventoStyles = (evento: Evento) => {
    const baseStyles = 'p-2 rounded-lg text-sm font-medium';
    
    switch (evento.type) {
      case 'vencimiento':
        return `${baseStyles} bg-red-100 text-red-800 border border-red-200`;
      case 'revision':
        return `${baseStyles} bg-blue-100 text-blue-800 border border-blue-200`;
      case 'aprobacion':
        return `${baseStyles} bg-green-100 text-green-800 border border-green-200`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  const getEventoIcon = (evento: Evento) => {
    switch (evento.type) {
      case 'vencimiento':
        return <AlertTriangle size={14} />;
      case 'revision':
      case 'aprobacion':
        return <Clock size={14} />;
      default:
        return <Calendar size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-600">Seguimiento de vencimientos y eventos</p>
        </div>

        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['mes', 'semana', 'dia'] as const).map((vistaItem) => (
              <button
                key={vistaItem}
                onClick={() => setVista(vistaItem)}
                className={`px-3 py-1 rounded-md text-sm font-medium capitalize ${
                  vista === vistaItem
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {vistaItem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencen esta semana</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">3</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En revisión</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">5</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Calendario y eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de eventos próximos */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos Eventos</h2>
            
            <div className="space-y-3">
              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {getEventoIcon(evento)}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      evento.prioridad === 'MUY_ALTA' ? 'bg-red-100 text-red-800' :
                      evento.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {evento.entidad}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 text-sm mb-1">
                    {evento.title}
                  </h3>
                  
                  <p className="text-xs text-gray-600">
                    Caso: {evento.casoId}
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(evento.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vista de calendario */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {fechaSeleccionada.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            
            {/* Aquí integrarías un componente de calendario real */}
            <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">Vista de calendario</p>
                <p className="text-sm text-gray-500">
                  Integrar con librería de calendario como FullCalendar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}