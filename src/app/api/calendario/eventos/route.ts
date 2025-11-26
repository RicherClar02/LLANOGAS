// src/app/api/calendario/eventos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Obtener eventos REALES de la base de datos
    const casos = await prisma.caso.findMany({
      where: {
        OR: [
          // Vencimientos
          {
            fechaVencimiento: {
              gte: startDate ? new Date(startDate) : new Date(),
              lte: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          },
          // Casos recientes (últimos 7 días)
          {
            fechaRecepcion: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              lte: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      },
      include: {
        entidad: {
          select: {
            sigla: true,
            color: true
          }
        },
        responsable: {
          select: {
            name: true
          }
        },
        email: {
          select: {
            subject: true
          }
        }
      },
      orderBy: {
        fechaRecepcion: 'desc'
      }
    });

    // Formatear eventos para el calendario
    const eventosReales = casos.map(caso => {
      // Determinar el tipo de evento basado en el estado y fechas
      let tipo: 'vencimiento' | 'revision' | 'aprobacion' = 'vencimiento';
      let titulo = caso.asunto;
      let fecha = caso.fechaVencimiento || caso.fechaRecepcion;

      if (caso.estado === 'EN_REVISION') {
        tipo = 'revision';
        titulo = `Revisión - ${caso.asunto}`;
      } else if (caso.estado === 'EN_APROBACION') {
        tipo = 'aprobacion';
        titulo = `Aprobación - ${caso.asunto}`;
      } else if (caso.fechaVencimiento) {
        tipo = 'vencimiento';
        titulo = `Vencimiento - ${caso.asunto}`;
      }

      return {
        id: caso.id,
        title: titulo,
        date: fecha?.toISOString().split('T')[0] || caso.fechaRecepcion.toISOString().split('T')[0],
        type: tipo,
        casoId: caso.id,
        entidad: caso.entidad.sigla,
        prioridad: caso.prioridad as 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA'
      };
    });

    return NextResponse.json({ eventos: eventosReales });

  } catch (error) {
    console.error('Error obteniendo eventos reales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}