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

    // Contar notificaciones no leídas del usuario
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false
      }
    });

    // También contar emails nuevos no procesados
    const newEmailsCount = await prisma.email.count({
      where: {
        procesado: false,
        fecha: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
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
  } catch (error) {
    console.error('Error contando notificaciones no leídas:', error);
    return NextResponse.json(
      { success: false, count: 0, error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}