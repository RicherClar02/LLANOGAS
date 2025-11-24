/**
 * Definición de los roles de usuario basada en el enum UserRole de Prisma.
 * Es crucial mantener esta lista sincronizada con el archivo schema.prisma.
 */
export enum UserRole {
  ADMINISTRADOR_SISTEMA = 'ADMINISTRADOR_SISTEMA',
  ADMINISTRADOR_ASIGNACIONES = 'ADMINISTRADOR_ASIGNACIONES',
  GESTOR = 'GESTOR',
  REVISOR_JURIDICO = 'REVISOR_JURIDICO',
  APROBADOR = 'APROBADOR',
  ROL_SEGUIMIENTO = 'ROL_SEGUIMIENTO',
  AUDITOR = 'AUDITOR',
}

/**
 * Función de utilidad para verificar si un rol tiene permisos de administrador
 * o si es un rol de visualización (por ejemplo, AUDITOR o ROL_SEGUIMIENTO).
 * @param role El rol del usuario a verificar.
 * @returns Verdadero si el rol es un administrador de cualquier nivel.
 */
export const isAdminRole = (role: UserRole): boolean => {
  return role === UserRole.ADMINISTRADOR_SISTEMA || role === UserRole.ADMINISTRADOR_ASIGNACIONES;
};

/*
Este archivo se usará en:
1. NextAuth para agregar el rol al token de sesión.
2. Lógica de negocio para validar permisos (Role-Based Access Control - RBAC).
3. Componentes de UI para mostrar opciones según el rol.
*/