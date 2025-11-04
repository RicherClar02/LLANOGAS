// src/app/api/casos/[id]/route.ts
// API para operaciones específicas de un caso - GET, PUT
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Obtener un caso específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const caso = await prisma.caso.findUnique({
      where: { id: params.id },
      include: {
        entidad: {
          select: {
            id: true,
            nombre: true,
            sigla: true,
            color: true,
            tiempoRespuestaDias: true
          }
        },
        responsable: {
          select: {
            id: true,
            name: true,
            email: true,
            cargo: true
          }
        },
        creador: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        actividades: {
          include: {
            usuario: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          }
        },
        documentos: {
          include: {
            usuario: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!caso) {
      return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
    }

    return NextResponse.json(caso);
  } catch (error) {
    console.error('Error al obtener caso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un caso
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      asunto, 
      descripcion, 
      prioridad, 
      estado, 
      etapaAprobacion,
      responsableId, 
      fechaVencimiento 
    } = body;

    // Verificar que el caso existe
    const casoExistente = await prisma.caso.findUnique({
      where: { id: params.id }
    });

    if (!casoExistente) {
      return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 });
    }

    // Actualizar el caso
    const casoActualizado = await prisma.caso.update({
      where: { id: params.id },
      data: {
        ...(asunto && { asunto }),
        ...(descripcion !== undefined && { descripcion }),
        ...(prioridad && { prioridad }),
        ...(estado && { estado }),
        ...(etapaAprobacion && { etapaAprobacion }),
        ...(responsableId && { responsableId }),
        ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }),
        updatedAt: new Date()
      },
      include: {
        entidad: {
          select: {
            id: true,
            nombre: true,
            sigla: true,
            color: true
          }
        },
        responsable: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        actividades: {
          include: {
            usuario: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          },
          take: 10
        }
      }
    });

    return NextResponse.json(casoActualizado);
  } catch (error) {
    console.error('Error al actualizar caso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}