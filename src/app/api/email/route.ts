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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const entidad = searchParams.get('entidad') || '';
    const conRadicado = searchParams.get('conRadicado');
    const dominio = searchParams.get('dominio') || '';
    const prioridad = searchParams.get('prioridad') || '';

    const skip = (page - 1) * pageSize;

    // Construir filtros
    const where: any = {
      procesado: true
    };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { from: { contains: search, mode: 'insensitive' } },
        { remitenteOriginal: { contains: search, mode: 'insensitive' } },
        { numeroRadicado: { contains: search, mode: 'insensitive' } },
        { entidadDetectada: { contains: search, mode: 'insensitive' } },
        { palabrasClave: { has: search } }
      ];
    }

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
      where.prioridadDetectada = prioridad;
    }

    // Obtener emails
    const [emails, totalEmails] = await Promise.all([
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
      prisma.email.count({ where })
    ]);

    // Formatear respuesta
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
      caso: email.caso ? {
        id: email.caso.id,
        estado: email.caso.estado,
        responsable: email.caso.responsable?.name || 'Sin asignar',
        responsableEmail: email.caso.responsable?.email,
        responsableCargo: email.caso.responsable?.cargo,
        entidad: email.caso.entidad?.sigla,
        fechaVencimiento: email.caso.fechaVencimiento,
        etapaAprobacion: email.caso.etapaAprobacion
      } : null,
      procesado: email.procesado,
      clasificado: email.clasificado,
      // Información adicional para filtros
      esGubernamental: email.dominioRemitente?.includes('.gov.co') || email.dominioRemitente?.includes('.gob.co'),
      esGmail: email.dominioRemitente?.includes('gmail.com'),
      esComercial: !email.dominioRemitente?.includes('.gov.co') && 
                   !email.dominioRemitente?.includes('.gob.co') && 
                   !email.dominioRemitente?.includes('gmail.com')
    }));

    // Obtener estadísticas para filtros
    const entidadesUnicas = await prisma.email.groupBy({
      by: ['entidadDetectada'],
      where: { procesado: true },
      _count: { id: true }
    });

    const dominiosUnicos = await prisma.email.groupBy({
      by: ['dominioRemitente'],
      where: { procesado: true },
      _count: { id: true }
    });

    const prioridadesUnicas = await prisma.email.groupBy({
      by: ['prioridadDetectada'],
      where: { procesado: true },
      _count: { id: true }
    });

    const totalPages = Math.ceil(totalEmails / pageSize);

    return NextResponse.json({
      emails: emailsFormateados,
      pagination: {
        currentPage: page,
        pageSize,
        totalEmails,
        totalPages,
      },
      filtros: {
        entidades: entidadesUnicas.map(e => ({
          nombre: e.entidadDetectada,
          count: e._count.id
        })),
        dominios: dominiosUnicos.map(d => ({
          nombre: d.dominioRemitente,
          count: d._count.id
        })),
        prioridades: prioridadesUnicas.map(p => ({
          nombre: p.prioridadDetectada,
          count: p._count.id
        }))
      }
    });

  } catch (error) {
    console.error('Error obteniendo emails:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}