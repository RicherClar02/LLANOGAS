import { isWeekend, getDay, isSameDay, addDays } from 'date-fns';

// ----------------------------------------------------
// Lógica de Festivos Dinámicos
// ----------------------------------------------------

// NOTA: Para un sistema 100% robusto, se recomienda usar una API para festivos
// móviles. Sin embargo, esta función permite incluir los festivos fijos y
// simular los festivos móviles más comunes.
// Para este ejemplo, solo usaremos una lista anual.

/**
 * Retorna una lista de fechas (Date objects) de festivos colombianos para un año dado.
 * En un proyecto real, esta lista debería cargarse de una API o calcularse con una librería especializada.
 * @param year El año para el cual obtener los festivos.
 * @returns Array de objetos Date.
 */
export const getFestivosColombia = (year: number): Date[] => {
  const festivos: Date[] = [];

  // Festivos Fijos (Día del año)
  festivos.push(new Date(year, 0, 1)); // Año Nuevo (Enero 1)
  festivos.push(new Date(year, 4, 1)); // Día del Trabajo (Mayo 1)
  festivos.push(new Date(year, 6, 20)); // Día de la Independencia (Julio 20)
  festivos.push(new Date(year, 7, 7)); // Batalla de Boyacá (Agosto 7)
  festivos.push(new Date(year, 11, 8)); // Inmaculada Concepción (Diciembre 8)
  festivos.push(new Date(year, 11, 25)); // Navidad (Diciembre 25)

  // Ejemplo: Festivos Móviles (Revisar lista oficial para Ley Emiliani)
  if (year === 2024) {
    festivos.push(new Date(year, 0, 8)); // Día de Reyes (Lunes 8 Ene)
    festivos.push(new Date(year, 2, 25)); // Lunes Santo
    // ... más festivos de Ley Emiliani 2024 ...
  }
  // Si necesitas 2025:
  if (year === 2025) {
    festivos.push(new Date(year, 0, 6)); // Día de Reyes (Lunes 6 Ene)
    festivos.push(new Date(year, 3, 14)); // Lunes Santo
    // ... festivos 2025 ...
  }

  return festivos;
};

// ----------------------------------------------------
// Lógica de Días Hábiles
// ----------------------------------------------------

/**
 * Determina si una fecha dada es un día hábil colombiano.
 * @param date La fecha a verificar (objeto Date).
 * @returns true si es día hábil (L-V, no festivo), false en caso contrario.
 */
export const isDiaHabilColombiano = (date: Date): boolean => {
  // 1. Excluir Sábados y Domingos
  if (isWeekend(date)) {
    return false;
  }

  // 2. Excluir Días Festivos
  const year = date.getFullYear();
  const festivos = getFestivosColombia(year);
  
  // Comparamos si la fecha coincide con algún festivo
  if (festivos.some(festivo => isSameDay(festivo, date))) {
    return false;
  }

  return true;
};


// ----------------------------------------------------
// Lógica de Navegación de Fechas
// ----------------------------------------------------

/**
 * Calcula el rango de una semana (Lunes a Domingo) para la fecha dada.
 * @param date La fecha base.
 * @returns {start: Date, end: Date}
 */
export const getRangoSemanal = (date: Date) => {
  // getDay() retorna 0 para Domingo, 1 para Lunes, ..., 6 para Sábado
  // Para date-fns, 0 es Domingo. Queremos que el Lunes sea el inicio.
  
  let dayOfWeek = getDay(date);
  
  // Si es Domingo (0), restamos 6 días para llegar al Lunes anterior.
  // Si es Lunes (1), restamos 0 días.
  // Si es Sábado (6), restamos 5 días para llegar al Lunes.
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajuste para que 1 sea Lunes

  const start = addDays(date, -diff);
  const end = addDays(start, 6);

  // Asegurar que las horas sean exactas para el rango
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};