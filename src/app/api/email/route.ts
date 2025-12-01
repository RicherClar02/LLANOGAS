import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prioridad } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Configuración de timeout
const QUERY_TIMEOUT = 15000; // 15 segundos

const withTimeout = <T>(promise: Promise<T>, timeout: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout excedido')), timeout)
    )
  ]);
};

const handlePrismaError = (error: any) => {
  console.error('Error de Prisma:', error);
  
  if (error.message.includes('Timeout')) {
    return { error: 'La consulta está tomando demasiado tiempo', code: 'TIMEOUT' };
  }
  
  if (error.message.includes('Engine')) {
    return { error: 'Error de conexión con la base de datos', code: 'DB_CONNECTION' };
  }
  
  return { error: 'Error interno del servidor', code: 'INTERNAL_ERROR' };
};

// Función para obtener estadísticas con manejo robusto
const getEmailStats = async (search?: string) => {
  const baseWhere: any = { 
    procesado: true
  };

  // Solo agregar filtro de búsqueda si existe
  if (search) {
    baseWhere.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { from: { contains: search, mode: 'insensitive' } }
    ];
  }

  try {
    const [entidadesUnicas, dominiosUnicos, prioridadesUnicas] = await Promise.all([
      // Consulta optimizada para entidades
      withTimeout(
        prisma.email.groupBy({
          by: ['entidadDetectada'],
          where: baseWhere,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 50 // Limitar resultados
        }),
        QUERY_TIMEOUT
      ).catch(() => []),

      // Consulta optimizada para dominios
      withTimeout(
        prisma.email.groupBy({
          by: ['dominioRemitente'],
          where: baseWhere,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 30
        }),
        QUERY_TIMEOUT
      ).catch(() => []),

      // Consulta optimizada para prioridades
      withTimeout(
        prisma.email.groupBy({
          by: ['prioridadDetectada'],
          where: baseWhere,
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        }),
        QUERY_TIMEOUT
      ).catch(() => [])
    ]);

    return {
      entidadesUnicas: entidadesUnicas || [],
      dominiosUnicos: dominiosUnicos || [],
      prioridadesUnicas: prioridadesUnicas || []
    };
  } catch (error) {
    console.error('Error en getEmailStats:', error);
    return {
      entidadesUnicas: [],
      dominiosUnicos: [],
      prioridadesUnicas: []
    };
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100);
    const search = searchParams.get('search') || '';
    const entidad = searchParams.get('entidad') || '';
    const conRadicado = searchParams.get('conRadicado');
    const dominio = searchParams.get('dominio') || '';
    const prioridad = searchParams.get('prioridad') || '';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const skip = (page - 1) * pageSize;

    // Construir filtros de manera optimizada
    const where: any = {
      procesado: true
    };

    // Filtro de búsqueda general
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { remitenteOriginal: { contains: search, mode: 'insensitive' } },
        { numeroRadicado: { contains: search, mode: 'insensitive' } },
        { entidadDetectada: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtros específicos
    if (entidad) {
      where.entidadDetectada = entidad;
    }

    if (conRadicado === 'true') {
      where.numeroRadicado = { not: null };
    } else if (conRadicado === 'false') {
      where.numeroRadicado = null;
    }

    if (dominio) {
      where.dominioRemitente = { contains: dominio, mode: 'insensitive' };
    }

    if (prioridad) {
      where.prioridadDetectada = prioridad as Prioridad;
    }

    // Filtro por fecha
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) {
        where.fecha.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        where.fecha.lte = new Date(fechaFin);
      }
    }

    // Obtener emails con timeout
    const [emails, totalEmails, stats] = await Promise.all([
      withTimeout(
        prisma.email.findMany({
          where,
          include: {
            caso: {
              include: {
                entidad: {
                  select: {
                    sigla: true,
                    nombre: true,
                    color: true
                  }
                },
                responsable: {
                  select: {
                    name: true,
                    email: true,
                    cargo: true
                  }
                }
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          },
          skip,
          take: pageSize,
        }),
        QUERY_TIMEOUT
      ),
      withTimeout(
        prisma.email.count({ where }),
        QUERY_TIMEOUT
      ),
      getEmailStats(search)
    ]);

    // Formatear respuesta completa basada en tu schema exacto
    const emailsFormateados = emails.map(email => ({
      id: email.id,
      messageId: email.messageId,
      asunto: email.subject,
      remitente: email.remitenteOriginal || email.from,
      emailRemitente: email.from,
      entidad: email.entidadDetectada,
      prioridad: email.prioridadDetectada,
      radicado: email.numeroRadicado,
      fecha: email.fecha,
      dominioRemitente: email.dominioRemitente,
      esEntidadControl: email.esEntidadControl,
      tieneCaso: !!email.caso,
      // Información completa del email según tu schema EXACTO
      body: email.body,
      html: email.html, // Usando html en lugar de bodyPlain
      to: email.to,
      attachments: email.attachments,
      palabrasClave: email.palabrasClave,
      procesado: email.procesado,
      clasificado: email.clasificado,
      // Información del caso asociado
      caso: email.caso ? {
        id: email.caso.id,
        asunto: email.caso.asunto,
        estado: email.caso.estado,
        prioridad: email.caso.prioridad,
        etapaAprobacion: email.caso.etapaAprobacion,
        responsable: email.caso.responsable?.name || 'Sin asignar',
        responsableEmail: email.caso.responsable?.email,
        responsableCargo: email.caso.responsable?.cargo,
        entidad: email.caso.entidad?.sigla,
        nombreEntidad: email.caso.entidad?.nombre,
        colorEntidad: email.caso.entidad?.color,
        fechaVencimiento: email.caso.fechaVencimiento,
        fechaRecepcion: email.caso.fechaRecepcion
      } : null,
      // Metadatos para filtros avanzados
      metadata: {
        esGubernamental: email.dominioRemitente?.includes('.gov.co') || 
                         email.dominioRemitente?.includes('.gob.co'),
        esGmail: email.dominioRemitente?.includes('gmail.com'),
        esComercial: !email.dominioRemitente?.includes('.gov.co') && 
                     !email.dominioRemitente?.includes('.gob.co') && 
                     !email.dominioRemitente?.includes('gmail.com'),
        tieneAdjuntos: (email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0),
        urgencia: email.prioridadDetectada === 'ALTA' || email.prioridadDetectada === 'MUY_ALTA' ? 'URGENTE' : 
                 email.prioridadDetectada === 'MEDIA' ? 'MEDIA' : 'BAJA'
      }
    }));

    const totalPages = Math.ceil(totalEmails / pageSize);

    // Corregir el error de TypeScript en los filtros
    const entidadesFiltradas = stats.entidadesUnicas
      .map(e => ({
        nombre: e.entidadDetectada,
        count: e._count?.id || 0
      }))
      .filter(e => e.nombre);

    const dominiosFiltrados = stats.dominiosUnicos
      .map(d => ({
        nombre: d.dominioRemitente,
        count: d._count?.id || 0
      }))
      .filter(d => d.nombre);

    const prioridadesFiltradas = stats.prioridadesUnicas
      .map(p => ({
        nombre: p.prioridadDetectada,
        count: p._count?.id || 0
      }))
      .filter(p => p.nombre);

    // Obtener estadísticas adicionales
    const [conRadicadoCount, sinRadicadoCount, conCasoCount] = await Promise.all([
      prisma.email.count({ 
        where: { ...where, numeroRadicado: { not: null } }
      }).catch(() => 0),
      prisma.email.count({ 
        where: { ...where, numeroRadicado: null } 
      }).catch(() => 0),
      prisma.email.count({ 
        where: { ...where, caso: { isNot: null } } 
      }).catch(() => 0)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        emails: emailsFormateados,
        pagination: {
          currentPage: page,
          pageSize,
          totalEmails,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filtros: {
          entidades: entidadesFiltradas,
          dominios: dominiosFiltrados,
          prioridades: prioridadesFiltradas
        },
        summary: {
          totalProcesados: totalEmails,
          conRadicado: conRadicadoCount,
          sinRadicado: sinRadicadoCount,
          conCaso: conCasoCount
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo emails:', error);
    const errorInfo = handlePrismaError(error);
    
    return NextResponse.json(
      { 
        success: false,
        error: errorInfo.error,
        code: errorInfo.code,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}