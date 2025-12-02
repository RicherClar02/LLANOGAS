import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGmailSyncService } from '@/services/gmail-sync-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Solo administradores pueden ejecutar sincronización manual
    if (!session || !['ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const syncService = getGmailSyncService();
    
    // Ejecutar sincronización
    await syncService.syncNow();

    return NextResponse.json({
      success: true,
      message: 'Sincronización de Gmail iniciada manualmente'
    });

  } catch (error) {
    console.error('Error en sincronización manual:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error en sincronización',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    const syncService = getGmailSyncService();

    switch (action) {
      case 'start':
        syncService.start();
        return NextResponse.json({
          success: true,
          message: 'Servicio de sincronización iniciado'
        });

      case 'stop':
        syncService.stop();
        return NextResponse.json({
          success: true,
          message: 'Servicio de sincronización detenido'
        });

      case 'status':
        return NextResponse.json({
          success: true,
          status: 'running', // Podrías agregar más detalles del estado
          message: 'Servicio activo'
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error manejando servicio Gmail:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}