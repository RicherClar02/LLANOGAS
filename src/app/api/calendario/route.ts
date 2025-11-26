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

    // Obtener eventos del calendario (vencimientos y fechas importantes)
    const eventos = await prisma.caso.findMany({
      where: {
        OR: [
          // Vencimientos
          {
            fechaVencimiento: {
              gte: startDate ? new Date(startDate) : new Date(),
              lte: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          },
          // Fechas de revisión (casos en revisión)
          {
            estado: 'EN_REVISION',
            fechaRecepcion: {
              gte: startDate ? new Date(startDate) : new Date(),
              lte: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          },
          // Fechas de aprobación (casos en aprobación)
          {
            estado: 'EN_APROBACION',
            fechaRecepcion: {
              gte: startDate ? new Date(startDate) : new Date(),
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
        }
      }
    });

    // Formatear eventos para el calendario
    const eventosCalendario = eventos.map(caso => {
      let tipo: 'vencimiento' | 'revision' | 'aprobacion' = 'vencimiento';
      let titulo = '';
      let fecha = caso.fechaVencimiento;

      if (caso.estado === 'EN_REVISION') {
        tipo = 'revision';
        titulo = `Revisión - ${caso.asunto}`;
        fecha = caso.fechaRecepcion; // O alguna fecha específica de revisión
      } else if (caso.estado === 'EN_APROBACION') {
        tipo = 'aprobacion';
        titulo = `Aprobación - ${caso.asunto}`;
        fecha = caso.fechaRecepcion; // O alguna fecha específica de aprobación
      } else {
        titulo = `Vencimiento - ${caso.asunto}`;
        fecha = caso.fechaVencimiento;
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

    return NextResponse.json({ eventos: eventosCalendario });

  } catch (error) {
    console.error('Error obteniendo eventos del calendario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}