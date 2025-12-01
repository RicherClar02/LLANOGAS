// src/lib/notifications.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function crearNotificacionCasoPorVencer(caso: any) {
  try {
    // Buscar usuarios que deben recibir la notificación
    const usuarios = await prisma.user.findMany({
      where: {
        OR: [
          { id: caso.responsableId }, // Responsable del caso
          { role: 'ADMINISTRADOR_SISTEMA' }, // Administradores
          { role: 'ADMINISTRADOR_ASIGNACIONES' } // Administradores de asignaciones
        ]
      }
    });

    const diasRestantes = Math.ceil(
      (new Date(caso.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    for (const usuario of usuarios) {
      await prisma.notification.create({
        data: {
          type: diasRestantes <= 2 ? 'error' : 'warning',
          title: diasRestantes <= 2 ? 'Caso vencido' : 'Caso por vencer',
          message: `El caso ${caso.numeroRadicadoEntrada || caso.id} ${diasRestantes <= 2 ? 'ha vencido' : `vence en ${diasRestantes} días`}`,
          userId: usuario.id, // ✅ Esto está bien - usuario.id siempre existe
          casoId: caso.id,
          read: false
        }
      });
    }
  } catch (error) {
    console.error('Error creando notificación de caso por vencer:', error);
  }
}

export async function crearNotificacionNuevoComentario(casoId: string, usuarioId: string, comentario: string) {
  try {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: { responsable: true }
    });

    if (!caso) return;

    // Notificar al responsable y creador - FILTRAR valores nulos
    const usuariosANotificar = [caso.responsableId, caso.creadorId]
      .filter((id): id is string => id !== null); // ✅ Filtra y asegura que son strings

    for (const usuarioId of usuariosANotificar) {
      await prisma.notification.create({
        data: {
          type: 'info',
          title: 'Nuevo comentario',
          message: `Tienes un nuevo comentario en el caso ${caso.numeroRadicadoEntrada || caso.id}: ${comentario.substring(0, 100)}...`,
          userId: usuarioId, // ✅ Ahora es siempre string, no null
          casoId: caso.id,
          read: false
        }
      });
    }
  } catch (error) {
    console.error('Error creando notificación de nuevo comentario:', error);
  }
}

export async function crearNotificacionCasoCompletado(casoId: string) {
  try {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: { responsable: true, creador: true }
    });

    if (!caso) return;

    // Notificar al responsable, creador y administradores - FILTRAR IDs nulos
    const usuariosIds = [caso.responsableId, caso.creadorId]
      .filter((id): id is string => id !== null);

    const usuarios = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: usuariosIds } },
          { role: 'ADMINISTRADOR_SISTEMA' },
          { role: 'ADMINISTRADOR_ASIGNACIONES' }
        ]
      }
    });

    for (const usuario of usuarios) {
      await prisma.notification.create({
        data: {
          type: 'success',
          title: 'Caso completado',
          message: `El caso ${caso.numeroRadicadoEntrada || caso.id} ha sido cerrado exitosamente`,
          userId: usuario.id,
          casoId: caso.id,
          read: false
        }
      });
    }
  } catch (error) {
    console.error('Error creando notificación de caso completado:', error);
  }
}