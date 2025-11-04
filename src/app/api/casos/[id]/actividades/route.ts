// src/app/api/actividades/route.ts
// API para gestionar actividades del sistema
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// POST - Crear nueva actividad
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, descripcion, casoId, usuarioId } = body;

    // Validaciones
    if (!tipo || !descripcion || !casoId || !usuarioId) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el caso existe
    const caso = await prisma.caso.findUnique({
      where: { id: casoId }
    });

    if (!caso) {
      return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
    }

    // Crear la actividad
    const actividad = await prisma.actividad.create({
      data: {
        tipo,
        descripcion,
        casoId,
        usuarioId,
        fecha: new Date(),
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true
          }
        },
        caso: {
          select: {
            id: true,
            asunto: true
          }
        }
      }
    });

    return NextResponse.json(actividad, { status: 201 });
  } catch (error) {
    console.error('Error creando actividad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener actividades (con filtros opcionales)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const casoId = searchParams.get('casoId');
    const usuarioId = searchParams.get('usuarioId');
    const limit = searchParams.get('limit');

    const where: any = {};
    
    if (casoId) {
      where.casoId = casoId;
    }
    
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    const actividades = await prisma.actividad.findMany({
      where,
      include: {
        usuario: {
          select: {
            name: true,
            email: true
          }
        },
        caso: {
          select: {
            id: true,
            asunto: true,
            entidad: {
              select: {
                sigla: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      take: limit ? parseInt(limit) : 50
    });

    return NextResponse.json({ actividades });
  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}