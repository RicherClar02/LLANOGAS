// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener notificaciones reales de la base de datos
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: session.user.id 
      },
      include: {
        caso: {
          select: {
            id: true,
            asunto: true,
            numeroRadicadoEntrada: true
          }
        }
      },
      orderBy: { 
        timestamp: 'desc' 
      },
      take: 50 // Limitar a las 50 más recientes
    });

    // Formatear la respuesta
    const notificacionesFormateadas = notifications.map(notif => ({
      id: notif.id,
      type: notif.type as 'success' | 'error' | 'warning' | 'info',
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp.toISOString(),
      read: notif.read,
      userId: notif.userId,
      casoId: notif.caso?.numeroRadicadoEntrada || notif.casoId
    }));

    return NextResponse.json({ 
      success: true,
      notifications: notificacionesFormateadas 
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Crear notificación real en la base de datos
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
  } catch (error) {
    console.error('Error creando notificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}