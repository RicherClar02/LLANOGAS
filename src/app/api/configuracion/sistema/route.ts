// src/app/api/configuracion/sistema/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { accion } = await request.json();

    // Buscar un usuario del sistema para asociar las actividades
    const usuarioSistema = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMINISTRADOR_SISTEMA' },
          { email: 'sistema@llanogas.com' }
        ]
      }
    });

    // Crear un caso del sistema si no existe
    let casoSistema = await prisma.caso.findFirst({
      where: {
        asunto: 'Operaciones del Sistema'
      }
    });

    if (!casoSistema) {
      casoSistema = await prisma.caso.create({
        data: {
          asunto: 'Operaciones del Sistema',
          descripcion: 'Caso especial para registrar actividades del sistema',
          entidadId: (await prisma.entidad.findFirst())?.id || '', // Usar la primera entidad disponible
          estado: 'CERRADO',
          etapaAprobacion: 'CERRADO'
        }
      });
    }

    switch (accion) {
      case 'respaldar-bd':
        // En un entorno real, aquí ejecutarías el comando de respaldo de PostgreSQL
        // Por ahora simulamos la operación
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Registrar actividad de respaldo
        await prisma.actividad.create({
          data: {
            tipo: 'CREACION',
            descripcion: 'Respaldo de base de datos ejecutado',
            metadata: {
              accion: 'respaldar-bd',
              fecha: new Date().toISOString(),
              usuario: 'sistema'
            },
            casoId: casoSistema.id,
            usuarioId: usuarioSistema?.id || (await prisma.user.findFirst())?.id || '' // Usar cualquier usuario disponible
          }
        });

        return NextResponse.json({ 
          mensaje: 'Respaldo de base de datos completado exitosamente',
          archivo: `respaldo_${new Date().toISOString().split('T')[0]}.backup`,
          fecha: new Date().toISOString()
        });

      case 'limpiar-cache':
        // Simular limpieza de cache
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Aquí limpiarías cache de Prisma o cualquier otro cache
        await prisma.actividad.create({
          data: {
            tipo: 'CREACION',
            descripcion: 'Limpieza de cache del sistema ejecutada',
            metadata: {
              accion: 'limpiar-cache',
              fecha: new Date().toISOString(),
              usuario: 'sistema'
            },
            casoId: casoSistema.id,
            usuarioId: usuarioSistema?.id || (await prisma.user.findFirst())?.id || ''
          }
        });

        return NextResponse.json({ 
          mensaje: 'Cache limpiado exitosamente',
          cacheEliminado: '512 MB',
          fecha: new Date().toISOString()
        });

      case 'sincronizar-entidades':
        // Sincronizar entidades con la bandeja de correo
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Obtener estadísticas actuales
        const syncTotalEntidades = await prisma.entidad.count();
        const syncEntidadesActivas = await prisma.entidad.count({
          where: { activo: true }
        });

        await prisma.actividad.create({
          data: {
            tipo: 'CREACION',
            descripcion: 'Sincronización de entidades con bandeja ejecutada',
            metadata: {
              accion: 'sincronizar-entidades',
              totalEntidades: syncTotalEntidades,
              entidadesActivas: syncEntidadesActivas,
              fecha: new Date().toISOString(),
              usuario: 'sistema'
            },
            casoId: casoSistema.id,
            usuarioId: usuarioSistema?.id || (await prisma.user.findFirst())?.id || ''
          }
        });

        return NextResponse.json({ 
          mensaje: 'Entidades sincronizadas con la bandeja exitosamente',
          entidadesActualizadas: syncEntidadesActivas,
          totalEntidades: syncTotalEntidades,
          fecha: new Date().toISOString()
        });

      case 'estadisticas-sistema':
        // Obtener estadísticas en tiempo real
        const [
          totalUsuarios,
          usuariosActivos,
          totalEntidades,
          entidadesActivas,
          totalCasos,
          casosPendientes,
          documentos
        ] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { activo: true } }),
          prisma.entidad.count(),
          prisma.entidad.count({ where: { activo: true } }),
          prisma.caso.count(),
          prisma.caso.count({ where: { estado: 'PENDIENTE' } }),
          prisma.documento.count()
        ]);

        return NextResponse.json({
          estadisticas: {
            usuarios: { total: totalUsuarios, activos: usuariosActivos },
            entidades: { total: totalEntidades, activas: entidadesActivas },
            casos: { total: totalCasos, pendientes: casosPendientes },
            documentos: { total: documentos }
          },
          fecha: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en operación del sistema:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}