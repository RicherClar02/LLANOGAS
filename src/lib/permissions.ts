// src/lib/permissions.ts - NUEVO ARCHIVO
export const ROLES = {
  ADMINISTRADOR_SISTEMA: 'ADMINISTRADOR_SISTEMA',
  ADMINISTRADOR_ASIGNACIONES: 'ADMINISTRADOR_ASIGNACIONES', 
  GESTOR: 'GESTOR',
  REVISOR_JURIDICO: 'REVISOR_JURIDICO',
  APROBADOR: 'APROBADOR',
  ROL_SEGUIMIENTO: 'ROL_SEGUIMIENTO',
  AUDITOR: 'AUDITOR'
} as const;

export type UserRole = keyof typeof ROLES;

export const canAccess = (userRole: UserRole, requiredRole: UserRole | UserRole[]) => {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
};

// Permisos específicos por módulo
export const modulePermissions = {
  BANDEJA: [ROLES.ADMINISTRADOR_ASIGNACIONES, ROLES.GESTOR, ROLES.ADMINISTRADOR_SISTEMA],
  CALENDARIO: [ROLES.ADMINISTRADOR_ASIGNACIONES, ROLES.GESTOR, ROLES.ROL_SEGUIMIENTO],
  METRICAS: [ROLES.ROL_SEGUIMIENTO, ROLES.AUDITOR, ROLES.ADMINISTRADOR_SISTEMA],
  DOCUMENTOS: Object.values(ROLES), // Todos pueden ver documentos
  CONFIGURACION: [ROLES.ADMINISTRADOR_SISTEMA]
};