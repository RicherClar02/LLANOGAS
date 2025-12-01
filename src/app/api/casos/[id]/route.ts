import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TipoActividad } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Obtener un caso específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // CORRECCIÓN: Await params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID de caso no proporcionado' }, { status: 400 });
    }

    const caso = await prisma.caso.findUnique({
      where: { id },
      include: {
        email: {
          select: {
            id: true,
            subject: true,
            from: true,
            fecha: true,
            body: true,
            html: true,
            attachments: true,
            entidadDetectada: true,
            prioridadDetectada: true
          }
        },
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
            cargo: true,
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
                email: true,
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
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        revisiones: {
          include: {
            revisor: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            fechaAsignacion: 'desc'
          }
        },
        aprobaciones: {
          include: {
            aprobador: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            fechaAsignacion: 'desc'
          }
        }
      }
    });

    if (!caso) {
      return NextResponse.json({ 
        success: false,
        error: 'Caso no encontrado' 
      }, { status: 404 });
    }

    // Enriquecer datos del caso con propiedades que SÍ existen
    const casoEnriquecido = {
      ...caso,
      metadata: {
        diasRestantes: caso.fechaVencimiento ? 
          Math.ceil((new Date(caso.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
        vencido: caso.fechaVencimiento ? new Date(caso.fechaVencimiento) < new Date() : false,
        totalDocumentos: caso.documentos?.length || 0,
        totalActividades: caso.actividades?.length || 0,
        totalRevisiones: caso.revisiones?.length || 0,
        totalAprobaciones: caso.aprobaciones?.length || 0,
        ultimaActividad: caso.actividades?.[0] || null
      }
    };

    return NextResponse.json({
      success: true,
      data: casoEnriquecido
    });
  } catch (error) {
    console.error('Error al obtener caso:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Actualizar un caso
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // CORRECCIÓN: Await params
    const { id } = await params;
    const body = await request.json();
    
    const { 
      asunto, 
      descripcion, 
      prioridad, 
      estado, 
      etapaAprobacion,
      responsableId, 
      fechaVencimiento,
      observaciones
    } = body;

    // Verificar que el caso existe
    const casoExistente = await prisma.caso.findUnique({
      where: { id }
    });

    if (!casoExistente) {
      return NextResponse.json({ 
        success: false,
        error: 'Caso no encontrado' 
      }, { status: 404 });
    }

    // Preparar datos para actualización
    const updateData: any = {
      updatedAt: new Date()
    };

    // Solo actualizar campos proporcionados
    if (asunto !== undefined) updateData.asunto = asunto;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (prioridad !== undefined) updateData.prioridad = prioridad;
    if (estado !== undefined) updateData.estado = estado;
    if (etapaAprobacion !== undefined) updateData.etapaAprobacion = etapaAprobacion;
    if (responsableId !== undefined) updateData.responsableId = responsableId;
    if (fechaVencimiento !== undefined) updateData.fechaVencimiento = new Date(fechaVencimiento);

    // Actualizar el caso
    const casoActualizado = await prisma.caso.update({
      where: { id },
      data: updateData,
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
            email: true,
            cargo: true
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

    // CORRECCIÓN: Registrar actividad usando el modelo correcto "Actividad"
    if (Object.keys(body).length > 0) {
      await prisma.actividad.create({
        data: {
          casoId: id,
          usuarioId: session.user.id,
          tipo: TipoActividad.CAMBIO_ESTADO, // Usando el enum correcto
          descripcion: `Caso actualizado: ${Object.keys(body).join(', ')}`,
          fecha: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: casoActualizado,
      message: 'Caso actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar caso:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}