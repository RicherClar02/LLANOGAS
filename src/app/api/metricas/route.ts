// src/app/api/metricas/route.ts
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
    const rango = searchParams.get('rango') || '30d';

    // Calcular fechas según el rango
    const now = new Date();
    let startDate = new Date();

    switch (rango) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1a':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Obtener métricas REALES de la base de datos
    const [
      totalCasos,
      casosPendientes,
      casosPorVencer,
      casosResueltos,
      casosPorEstado,
      casosPorEntidad,
      casosCerrados
    ] = await Promise.all([
      // Total de casos
      prisma.caso.count({
        where: {
          fechaRecepcion: { gte: startDate }
        }
      }),

      // Casos pendientes (estados activos)
      prisma.caso.count({
        where: {
          fechaRecepcion: { gte: startDate },
          estado: {
            in: ['PENDIENTE', 'ASIGNADO', 'EN_REDACCION', 'EN_REVISION', 'EN_APROBACION']
          }
        }
      }),

      // Casos por vencer (próximos 7 días)
      prisma.caso.count({
        where: {
          fechaVencimiento: {
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            gte: now
          },
          estado: {
            in: ['PENDIENTE', 'ASIGNADO', 'EN_REDACCION', 'EN_REVISION', 'EN_APROBACION']
          }
        }
      }),

      // Casos resueltos
      prisma.caso.count({
        where: {
          fechaRecepcion: { gte: startDate },
          estado: {
            in: ['ENVIADO', 'CON_ACUSE', 'CERRADO']
          }
        }
      }),

      // Distribución por estado
      prisma.caso.groupBy({
        by: ['estado'],
        where: {
          fechaRecepcion: { gte: startDate }
        },
        _count: {
          id: true
        }
      }),

      // Casos por entidad
      prisma.caso.groupBy({
        by: ['entidadId'],
        where: {
          fechaRecepcion: { gte: startDate }
        },
        _count: {
          id: true
        }
      }),

      // Casos cerrados para calcular tiempo promedio
      prisma.caso.findMany({
        where: {
          estado: 'CERRADO',
          fechaRecepcion: { gte: startDate },
          fechaCierre: { not: null }
        },
        select: {
          fechaRecepcion: true,
          fechaCierre: true
        }
      })
    ]);

    // Obtener nombres de entidades
    const entidades = await prisma.entidad.findMany({
      select: { id: true, sigla: true, nombre: true }
    });

    // Calcular tiempo promedio de respuesta en días
    const tiempoPromedioDias = casosCerrados.length > 0 
      ? casosCerrados.reduce((sum, caso) => {
          const tiempo = caso.fechaCierre!.getTime() - caso.fechaRecepcion.getTime();
          return sum + (tiempo / (1000 * 60 * 60 * 24)); // Convertir milisegundos a días
        }, 0) / casosCerrados.length
      : 0;

    // Calcular tasa de cumplimiento (casos resueltos vs totales)
    const tasaCumplimiento = totalCasos > 0 
      ? Math.round((casosResueltos / totalCasos) * 100) 
      : 0;

    // Formatear la respuesta con datos REALES
    const metricas = {
      resumen: {
        totalCasos,
        casosPendientes,
        casosPorVencer,
        casosResueltos,
        tiempoPromedioRespuesta: Number(tiempoPromedioDias.toFixed(1)),
        tasaCumplimiento
      },
      casosPorEstado: casosPorEstado.map(item => ({
        estado: item.estado,
        count: item._count.id
      })),
      casosPorEntidad: casosPorEntidad.map(item => ({
        entidad: entidades.find(e => e.id === item.entidadId)?.sigla || 'Desconocida',
        count: item._count.id
      })),
      casosPorResponsable: [], // Podemos agregar esto después
      tendenciaMensual: [] // Podemos agregar esto después
    };

    return NextResponse.json(metricas);

  } catch (error) {
    console.error('Error obteniendo métricas reales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}