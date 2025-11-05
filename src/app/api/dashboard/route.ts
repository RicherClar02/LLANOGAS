// src/app/api/dashboard/route.ts
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

    // Obtener estadísticas generales
    const totalCasos = await prisma.caso.count();
    const casosPendientes = await prisma.caso.count({
      where: {
        estado: {
          in: ['PENDIENTE', 'ASIGNADO', 'EN_REDACCIÓN', 'EN_REVISION', 'EN_APROBACION']
        }
      }
    });
    
    const casosPorVencer = await prisma.caso.count({
      where: {
        fechaVencimiento: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
          gte: new Date()
        },
        estado: {
          in: ['PENDIENTE', 'ASIGNADO', 'EN_REDACCIÓN', 'EN_REVISION', 'EN_APROBACION']
        }
      }
    });

    const casosResueltos = await prisma.caso.count({
      where: {
        estado: {
          in: ['ENVIADO', 'CON_ACUSE', 'CERRADO']
        }
      }
    });

    // Casos recientes
    const casosRecientes = await prisma.caso.findMany({
      take: 5,
      include: {
        entidad: {
          select: {
            sigla: true,
            color: true
          }
        }
      },
      orderBy: {
        fechaRecepcion: 'desc'
      }
    });

    // Calcular tiempo promedio de respuesta (simplificado)
    const todosLosCasosCerrados = await prisma.caso.findMany({
      where: {
        estado: 'CERRADO'
      },
      select: {
        fechaRecepcion: true,
        fechaCierre: true
      }
    });

    const casosConFechasCompletas = todosLosCasosCerrados.filter(
      caso => caso.fechaRecepcion !== null && caso.fechaCierre !== null
    );

    let tiempoPromedio = 0;
    if (casosConFechasCompletas.length > 0) {
      const totalDias = casosConFechasCompletas.reduce((acc, caso) => {
        const dias = Math.ceil(
          (new Date(caso.fechaCierre!).getTime() - new Date(caso.fechaRecepcion!).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return acc + dias;
      }, 0);
      tiempoPromedio = totalDias / casosConFechasCompletas.length;
    }

    return NextResponse.json({
      totalCasos,
      casosPendientes,
      casosPorVencer,
      casosResueltos,
      tiempoPromedioRespuesta: Math.round(tiempoPromedio * 10) / 10,
      casosRecientes: casosRecientes.map(caso => ({
        id: caso.id,
        entidad: caso.entidad.sigla || 'N/A',
        asunto: caso.asunto,
        fecha: caso.fechaRecepcion.toISOString().split('T')[0],
        estado: caso.estado,
        color: caso.entidad.color || '#6B7280'
      }))
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}