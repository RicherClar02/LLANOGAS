import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // En una implementación real, esto vendría de tu base de datos
  const mockNotifications = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Caso por vencer',
      message: 'El caso SUI-2024-001 vence en 2 días',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      userId: session.user.id,
      casoId: 'SUI-2024-001'
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Nuevo comentario',
      message: 'Tienes un nuevo comentario en el caso SS-2024-015',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
      userId: session.user.id,
      casoId: 'SS-2024-015'
    }
  ];

  return NextResponse.json({ notifications: mockNotifications });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();

  // En una implementación real, guardarías en la base de datos
  const newNotification = {
    id: Math.random().toString(36).substr(2, 9),
    ...body,
    timestamp: new Date(),
    read: false
  };

  return NextResponse.json({ notification: newNotification });
}