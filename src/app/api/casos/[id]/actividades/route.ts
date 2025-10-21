// src/app/api/casos/[id]/actividades/route.ts
// API para gestionar actividades de un caso
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// POST - Agregar actividad a un caso
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, descripcion } = body;

    if (!tipo || !descripcion) {
      return NextResponse.json(
        { error: 'Tipo y descripción son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el caso existe
    const caso = await prisma.caso.findUnique({
      where: { id: params.id }
    });

    if (!caso) {
      return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
    }

    // Crear la actividad
    const actividad = await prisma.actividad.create({
      data: {
        tipo,
        descripcion,
        casoId: params.id,
        usuarioId: session.user.id
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(
      { actividad, message: 'Actividad agregada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear actividad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}