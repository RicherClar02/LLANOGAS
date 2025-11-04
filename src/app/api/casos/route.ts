// src/app/api/casos/route.ts
// API para gestión de casos - GET (listar) y POST (crear)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Listar todos los casos con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const prioridad = searchParams.get('prioridad');
    const entidad = searchParams.get('entidad');
    const search = searchParams.get('search');

    // Construir filtros
    const where: any = {};

    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    if (prioridad && prioridad !== 'todos') {
      where.prioridad = prioridad;
    }

    if (entidad && entidad !== 'todos') {
      where.entidad = {
        sigla: entidad
      };
    }

    if (search) {
      where.OR = [
        { asunto: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Obtener casos con relaciones
    const casos = await prisma.caso.findMany({
      where,
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
                name: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          },
          take: 5 // Últimas 5 actividades
        },
        _count: {
          select: {
            documentos: true,
            actividades: true
          }
        }
      },
      orderBy: {
        fechaRecepcion: 'desc'
      }
    });

    return NextResponse.json({ casos });
  } catch (error) {
    console.error('Error al obtener casos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo caso
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { asunto, descripcion, prioridad, entidadId, fechaVencimiento } = body;

    // Validaciones básicas
    if (!asunto || !entidadId) {
      return NextResponse.json(
        { error: 'Asunto y entidad son requeridos' },
        { status: 400 }
      );
    }

    // Crear el caso
    const nuevoCaso = await prisma.caso.create({
      data: {
        asunto,
        descripcion,
        prioridad: prioridad || 'MEDIA',
        estado: 'PENDIENTE',
        etapaAprobacion: 'RECIBIDO',
        tipoSolicitud: 'SOLICITUD_INFORMACION', // Valor por defecto
        entidadId,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        responsableId: session.user.id,
        creadorId: session.user.id
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
        }
      }
    });

    // Crear actividad de creación
    await prisma.actividad.create({
      data: {
        tipo: 'CREACION',
        descripcion: 'Caso creado manualmente',
        casoId: nuevoCaso.id,
        usuarioId: session.user.id
      }
    });

    return NextResponse.json(
      { 
        caso: nuevoCaso, 
        message: 'Caso creado exitosamente' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear caso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}