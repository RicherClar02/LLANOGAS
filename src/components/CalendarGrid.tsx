'use client';

import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, isSameDay,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { isDiaHabilColombiano } from '@/lib/colombia-utils';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

// Interfaces y Tipos
interface Evento {
  id: string;
  title: string;
  date: string;
  type: 'vencimiento' | 'revision' | 'aprobacion' | 'festivo';
  casoId: string;
  entidad: string;
  prioridad: 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';
}

interface CalendarGridProps {
  currentDate: Date;
  events: Evento[];
  view: 'mes' | 'semana' | 'dia'; // Añadida la prop de vista
}

// Función auxiliar para parsear la fecha y forzar la medianoche local
const parseEventDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00');
};

// ----------------------------------------------------
// 💡 Componente de Grid de Calendario
// ----------------------------------------------------
export default function CalendarGrid({ currentDate, events, view }: CalendarGridProps) {
  
  const today = useMemo(() => new Date(), []); // Para evitar recalcular en cada render

  const getDayEvents = (day: Date) => {
    return events.filter(evento =>
        isSameDay(day, parseEventDate(evento.date))
    );
  };
  
  const getEventIcon = (type: Evento['type']) => {
    switch (type) {
        case 'vencimiento':
            return <AlertTriangle size={10} className="text-red-600" />;
        case 'revision':
            return <Clock size={10} className="text-blue-600" />;
        case 'aprobacion':
            return <ShieldCheck size={10} className="text-green-600" />;
        case 'festivo':
            return <span className="text-xs text-yellow-600 font-bold">F</span>;
        default:
            return null;
    }
  };

  // ***************************************************************
  // Lógica de cálculo de días dinámica basada en la VISTA (MEJORA)
  // ***************************************************************
  const weekOptions = { locale: es, weekStartsOn: 1 as const };

  const { daysInCalendar, monthStart } = useMemo(() => {
    let startDate: Date;
    let endDate: Date;
    let startOfRelevantPeriod = currentDate; // Usamos currentDate por defecto para el día/semana

    if (view === 'mes') {
      startOfRelevantPeriod = startOfMonth(currentDate);
      const monthEnd = endOfMonth(startOfRelevantPeriod);
      startDate = startOfWeek(startOfRelevantPeriod, weekOptions);
      endDate = endOfWeek(monthEnd, weekOptions);
    } else if (view === 'semana') {
      startDate = startOfWeek(currentDate, weekOptions);
      endDate = endOfWeek(currentDate, weekOptions);
    } else { // view === 'dia'
      startDate = currentDate;
      endDate = currentDate;
    }

    const daysInCalendar = eachDayOfInterval({ start: startDate, end: endDate });
    return { daysInCalendar, monthStart: startOfRelevantPeriod };

  }, [currentDate, view]);

  // Si la vista es 'dia', mostramos la información de manera diferente (ej. lista de eventos o vista por hora)
  if (view === 'dia') {
    const dayEvents = getDayEvents(currentDate);
    return (
        <div className="p-4 bg-white rounded-xl shadow border h-full">
            <h3 className="text-lg font-bold mb-4">{format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}</h3>
            <div className="space-y-4 overflow-y-auto">
                {dayEvents.length > 0 ? (
                    dayEvents.map(event => (
                        <div key={event.id} className="p-3 border-l-4 border-blue-500 bg-gray-50 rounded-md shadow-sm">
                            <p className="font-semibold text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-600">Prioridad: {event.prioridad}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No hay eventos programados para este día.</p>
                )}
            </div>
        </div>
    );
  }

  // ***************************************************************
  // Vistas 'mes' y 'semana' (Grid)
  // ***************************************************************
  return (
    <div className="flex flex-col h-full text-sm">
      {/* Encabezado de la semana (Días de la semana) */}
      <div className="grid grid-cols-7 text-center font-semibold text-gray-600 border-b border-gray-200 flex-shrink-0">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
          <div key={day} className="py-2">
            {day.substring(0, 3)}
          </div>
        ))}
      </div>

      {/* Grid de Días */}
      <div className={`grid grid-cols-7 flex-grow ${view === 'mes' ? 'grid-rows-6' : 'grid-rows-1'}`}>
        {daysInCalendar.map((day, index) => {
          const isCurrentMonth = view !== 'semana' && isSameMonth(day, monthStart);
          const isTodayDay = isSameDay(day, today);
          const isWeekendDay = day.getDay() === 0 || day.getDay() === 6; // Domingo (0) o Sábado (6)
          const isHabil = isDiaHabilColombiano(day); // true si es día hábil
          
          // Lógica corregida para identificar festivo
          const isPublicHoliday = isCurrentMonth && !isHabil && !isWeekendDay; 
          
          const dayEvents = getDayEvents(day);
          
          const cellClasses = `
            border border-gray-100 p-1 transition-colors duration-100 overflow-hidden relative
            ${isCurrentMonth || view === 'semana' ? 'bg-white' : 'bg-gray-50 text-gray-400'}
            ${isTodayDay ? 'bg-blue-100 border-blue-400 font-bold' : ''}
            ${isPublicHoliday ? 'bg-red-50/50' : ''} /* Resaltar festivos que caen en semana */
            cursor-pointer hover:bg-gray-200
          `;

          return (
            <div key={index} className={cellClasses}>
              {/* Número del día */}
              <div className={`text-right text-base ${isTodayDay ? 'text-blue-800' : isWeekendDay ? 'text-gray-500' : 'text-gray-900'} ${!isCurrentMonth && view === 'mes' ? 'opacity-70' : ''}`}>
                {format(day, 'd')}
              </div>
              
              {/* Indicador de Día Hábil/Festivo CORREGIDO */}
              {isCurrentMonth && !isHabil && (
                  <span className="text-xs text-red-600 absolute top-0 left-1 font-semibold" title="Día no hábil (Fin de semana o Festivo)">
                      {isWeekendDay ? 'FDS' : 'Festivo'}
                  </span>
              )}
              
              {/* Lista de Eventos */}
              <div className="space-y-0.5 mt-1">
                {dayEvents.map(event => (
                  <div key={event.id} className={`flex items-center space-x-1 text-xs px-1 py-0.5 rounded-sm overflow-hidden whitespace-nowrap ${event.type === 'vencimiento' ? 'bg-red-100' : event.type === 'revision' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {getEventIcon(event.type)}
                    <span className="truncate">
                        {event.title.split(' ')[0]} {/* Mostrar solo la primera palabra */}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}