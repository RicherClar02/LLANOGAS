//src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Se recomienda usar una instancia singleton de Prisma Client
const prisma = new PrismaClient();

// =========================================================================
// GET: Obtener notificaciones y emails recientes, o solo el contador
// AHORA ES COMPARTIDO: TRAE TODAS LAS NOTIFICACIONES INDEPENDIENTEMENTE DEL USUARIO
// =========================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Solo verificamos que el usuario esté logueado, no nos importa cuál sea su ID
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ---------------------------------------------------------------------
    // ✅ RUTA PARA CONTADOR: /api/notifications?action=count
    // ---------------------------------------------------------------------
    if (action === 'count') {
      // ⚠️ IMPORTANTE: El contador ahora cuenta TODAS las no leídas en el sistema.
      const unreadCount = await prisma.notification.count({
        where: {
          // El filtro 'userId' ha sido ELIMINADO para que cuente globalmente.
          read: false 
        }
      });

      // Contar emails no procesados Y NO NOTIFICADOS de las últimas 24h (Global)
      const newEmailsCount = await prisma.email.count({
        where: {
          procesado: false,
          notificado: false, 
          fecha: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      return NextResponse.json({
        success: true,
        count: unreadCount + newEmailsCount,
        details: {
          notifications: unreadCount,
          emails: newEmailsCount,
          total: unreadCount + newEmailsCount
        }
      });
    }

    // ---------------------------------------------------------------------
    // ✅ RUTA PRINCIPAL PARA OBTENER EL LISTADO COMPLETO (GLOBAL)
    // ---------------------------------------------------------------------

    // 1. Obtener notificaciones del sistema
    const notifications = await prisma.notification.findMany({
      where: { 
        // ❌ Filtro de userId eliminado para hacerlas públicas
        // Ahora trae TODAS las notificaciones existentes en la tabla
      }, 
      include: {
        caso: {
          select: {
            id: true,
            asunto: true,
            numeroRadicadoEntrada: true,
            estado: true
          }
        }
      },
      orderBy: { 
        timestamp: 'desc' 
      },
      take: 100
    });

    // 2. Obtener emails recientes NO PROCESADOS Y NO NOTIFICADOS (Global)
    let emailsRecientes: any[] = [];
    try {
      emailsRecientes = await prisma.email.findMany({
        where: {
          procesado: false,
          notificado: false, 
          fecha: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          fecha: 'desc'
        },
        take: 20
      });

      // ✅ Marcar emails como notificados inmediatamente después de leerlos
      if (emailsRecientes.length > 0) {
        await prisma.email.updateMany({
          where: {
            id: { in: emailsRecientes.map(e => e.id) }
          },
          data: { notificado: true }
        });
      }
    } catch (emailError) {
      console.error('Error obteniendo emails:', emailError);
    }

    // 3. Formatear y combinar (El resto de la lógica permanece igual)
    
    const notificacionesFormateadas = notifications.map(notif => ({
      id: notif.id,
      type: notif.type as 'success' | 'error' | 'warning' | 'info',
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp,
      read: notif.read,
      userId: notif.userId,
      casoId: notif.caso?.numeroRadicadoEntrada || notif.casoId,
      estadoCaso: notif.caso?.estado,
      source: 'system'
    }));

    const notificacionesDeEmail = emailsRecientes.map(email => ({
      id: `email-${email.id}`,
      type: 'info' as const,
      title: '📧 Nuevo correo recibido',
      message: `De: ${email.from}\nAsunto: ${email.subject}${email.numeroRadicado ? `\nRadicado: ${email.numeroRadicado}` : ''}`, 
      timestamp: email.fecha,
      read: false, 
      emailId: email.id,
      casoId: email.numeroRadicado || undefined,
      source: 'email'
    }));

    const todasNotificaciones = [
      ...notificacionesFormateadas,
      ...notificacionesDeEmail
    ].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).map(notif => ({
      ...notif,
      timestamp: notif.timestamp.toISOString()
    }));

    return NextResponse.json({ 
      success: true,
      notifications: todasNotificaciones,
      metadata: {
        total: todasNotificaciones.length,
        emailsNuevos: emailsRecientes.length,
        notificacionesSistema: notifications.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/notifications:', error);
    
    // El manejo de errores de conexión/infraestructura permanece igual
    if (error.code === 'P1001' || error.code === 'P1003') { 
      return NextResponse.json(
        { 
          success: false,
          error: `Error de conexión con la base de datos (código ${error.code}). Por favor, verifica tu cadena de conexión (DATABASE_URL) y asegúrate de que el servicio de base de datos esté activo.`,
          code: error.code
        },
        { status: 503 }
      );
    }
    if (error.code === 'P2002' || error.name === 'PrismaClientUnknownRequestError') {
       return NextResponse.json(
        { 
          success: false,
          error: `Error de base de datos desconocido (código ${error.code || 'N/A'}). Esto podría indicar que las migraciones no se han ejecutado correctamente o que la configuración de Prisma es incorrecta.`,
          code: error.code
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error.message || 'Error desconocido'
      },
      { status: 500 }
    );
  } 
}

// =========================================================================
// POST: Crear una nueva notificación
// El userId sigue siendo necesario para rastrear quién la creó, pero no afecta la visibilidad.
// =========================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.type || !body.title || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: type, title, message' },
        { status: 400 }
      );
    }
    // ⚠️ Se mantiene el userId para saber quién está creando la notificación
    const newNotification = await prisma.notification.create({
      data: {
        type: body.type,
        title: body.title,
        message: body.message,
        userId: session.user.id, 
        casoId: body.casoId,
        read: false
      }
    });

    return NextResponse.json({ 
      success: true,
      notification: {
        id: newNotification.id,
        type: newNotification.type,
        title: newNotification.title,
        message: newNotification.message,
        timestamp: newNotification.timestamp.toISOString(),
        read: newNotification.read,
        userId: newNotification.userId,
        casoId: newNotification.casoId
      }
    });
  } catch (error: any) {
    console.error('Error creando notificación:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuario o caso no válido (ForeignKey constraint failed)'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// =========================================================================
// PUT: Marcar notificaciones como leídas (GLOBAL)
// =========================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, markAll } = body;
    
    // 1. Manejar la acción de Marcar TODAS como leídas (GLOBALMENTE)
    if (markAll === true) {
      const updateResult = await prisma.notification.updateMany({
        where: { 
          // ❌ Filtro de userId eliminado. Todos las notificaciones se marcan como leídas para todos.
          read: false
        },
        data: { read: true }
      });
      
      return NextResponse.json({ 
        success: true,
        count: updateResult.count,
        message: `Se marcaron ${updateResult.count} notificaciones como leídas globalmente`
      });
    }

    // 2. Manejar la acción de Marcar UNA como leída (GLOBALMENTE)
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de notificación requerido' }, 
        { status: 400 }
      );
    }
    
    const updatedNotification = await prisma.notification.update({
      where: { 
        id, 
        // ❌ Filtro de userId eliminado. Cualquier usuario puede marcarla como leída.
      },
      data: { read: true }
    });

    return NextResponse.json({ 
      success: true,
      notification: updatedNotification
    });

  } catch (error: any) {
    console.error('Error actualizando notificación:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Notificación no encontrada' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// =========================================================================
// DELETE: Eliminar notificaciones (GLOBAL)
// =========================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // 1. Eliminar todas las notificaciones (GLOBALMENTE)
    if (searchParams.get('all') === 'true') {
      const deleteResult = await prisma.notification.deleteMany({
        where: { 
          // ❌ Filtro de userId eliminado. Cualquier usuario logueado puede borrarlas.
        }
      });
      
      return NextResponse.json({ 
        success: true,
        count: deleteResult.count,
        message: `Se eliminaron ${deleteResult.count} notificaciones globalmente`
      });
    }

    // 2. Eliminar una notificación específica (GLOBALMENTE)
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de notificación requerido' }, 
        { status: 400 }
      );
    }
    
    const deletedNotification = await prisma.notification.delete({
      where: { 
        id, 
        // ❌ Filtro de userId eliminado. Cualquier usuario logueado puede borrarla.
      }
    });

    return NextResponse.json({ 
      success: true,
      notification: deletedNotification,
      message: 'Notificación eliminada correctamente'
    });

  } catch (error: any) {
    console.error('Error eliminando notificación:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Notificación no encontrada' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error.message 
      },
      { status: 500 }
    );
  }
}