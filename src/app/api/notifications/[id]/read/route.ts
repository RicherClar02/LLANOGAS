import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const notificationId = params.id;

  // En una implementación real, actualizarías en la base de datos
  console.log(`Marcando notificación ${notificationId} como leída`);

  return NextResponse.json({ success: true });
}