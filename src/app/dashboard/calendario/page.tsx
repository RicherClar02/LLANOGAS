// src/app/dashboard/calendario/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, Filter, Clock, AlertTriangle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { 
  format, 
  addMonths, subMonths, 
  addWeeks, subWeeks, 
  addDays, subDays,
  startOfWeek, endOfWeek,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { es } from 'date-fns/locale';

import CalendarGrid from '@/components/CalendarGrid';

interface Evento {
  id: string;
  title: string;
  date: string;
  type: 'vencimiento' | 'revision' | 'aprobacion' | 'festivo';
  casoId: string;
  entidad: string;
  prioridad: 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
}

export default function CalendarioPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [vista, setVista] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar eventos desde la API
  useEffect(() => {
    const cargarEventos = async () => {
      setLoading(true);
      try {
        let start: Date;
        let end: Date;

        if (vista === 'mes') {
          start = startOfMonth(fechaSeleccionada);
          end = endOfMonth(fechaSeleccionada);
        } else if (vista === 'semana') {
          start = startOfWeek(fechaSeleccionada, { locale: es });
          end = endOfWeek(fechaSeleccionada, { locale: es });
        } else {
          start = fechaSeleccionada;
          end = fechaSeleccionada;
        }

        const response = await fetch(
          `/api/calendario/eventos?start=${start.toISOString()}&end=${end.toISOString()}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setEventos(data.eventos);
        } else {
          console.error('Error cargando eventos');
          // Fallback con datos mock
          setEventos(getEventosMock());
        }
      } catch (error) {
        console.error('Error cargando eventos:', error);
        // Fallback con datos mock
        setEventos(getEventosMock());
      } finally {
        setLoading(false);
      }
    };

    cargarEventos();
  }, [fechaSeleccionada, vista]);

  // Datos mock para fallback
  const getEventosMock = (): Evento[] => [
    {
      id: '1',
      title: 'Vencimiento - Reporte SUI',
      date: new Date().toISOString().split('T')[0],
      type: 'vencimiento',
      casoId: 'SUI-2024-001',
      entidad: 'SUI',
      prioridad: 'ALTA'
    },
    {
      id: '2',
      title: 'Revisión Legal',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'revision',
      casoId: 'SS-2024-015',
      entidad: 'Superservicios',
      prioridad: 'MUY_ALTA'
    },
    {
      id: '3',
      title: 'Aprobación Técnica',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'aprobacion',
      casoId: 'MME-2024-008',
      entidad: 'Ministerio de Minas',
      prioridad: 'MEDIA'
    }
  ];

  // ******************************************************************
  // 1. Lógica de Navegación Dinámica (handlePrev y handleNext)
  // ******************************************************************

  const handlePrev = useCallback(() => {
    setFechaSeleccionada((prevDate) => {
      switch (vista) {
        case 'mes':
          return subMonths(prevDate, 1);
        case 'semana':
          return subWeeks(prevDate, 1);
        case 'dia':
          return subDays(prevDate, 1);
        default:
          return prevDate;
      }
    });
  }, [vista]);

  const handleNext = useCallback(() => {
    setFechaSeleccionada((prevDate) => {
      switch (vista) {
        case 'mes':
          return addMonths(prevDate, 1);
        case 'semana':
          return addWeeks(prevDate, 1);
        case 'dia':
          return addDays(prevDate, 1);
        default:
          return prevDate;
      }
    });
  }, [vista]);

  // ******************************************************************
  // 2. Título que se Adapta a la Vista (tituloNavegacion)
  // ******************************************************************

  const tituloNavegacion = useMemo(() => {
    const options = { locale: es };
    
    switch (vista) {
      case 'mes':
        return format(fechaSeleccionada, 'MMMM yyyy', options);
      case 'semana':
        const start = startOfWeek(fechaSeleccionada, options);
        const end = endOfWeek(fechaSeleccionada, options);
        return `Semana del ${format(start, 'd MMMM', options)} al ${format(end, 'd MMMM yyyy', options)}`;
      case 'dia':
        return format(fechaSeleccionada, 'EEEE, d MMMM yyyy', options);
      default:
        return format(fechaSeleccionada, 'MMMM yyyy', options);
    }
  }, [fechaSeleccionada, vista]);

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

  if (loading && eventos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

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
              <p className="text-sm font-medium text-gray-700">Vencen esta semana</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {eventos.filter(e => e.type === 'vencimiento' && 
                  new Date(e.date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
              </p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {eventos.filter(e => e.type === 'revision').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Próximos eventos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {eventos.filter(e => new Date(e.date) >= new Date()).length}
              </p>
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
              {eventos
                .filter(evento => new Date(evento.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((evento) => (
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
              {eventos.filter(e => new Date(e.date) >= new Date()).length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay eventos próximos</p>
              )}
            </div>
          </div>
        </div>

        {/* Vista de calendario (Controles y Grid Integrados) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            
            {/* Controles de Navegación y Vista */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <button onClick={handlePrev} className="p-2 border rounded-full hover:bg-gray-100">
                  <ChevronLeft size={16} className="text-indigo-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {tituloNavegacion}
                </h2>
                <button onClick={handleNext} className="p-2 border rounded-full hover:bg-gray-100">
                  <ChevronRight size={16} className="text-indigo-600" />
                </button>
              </div>

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
            
            {/* Área de Calendario */}
            <div className="flex-grow">
              <CalendarGrid 
                currentDate={fechaSeleccionada} 
                events={eventos} 
                view={vista}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}