import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Función auxiliar para quitar acentos y convertir a MAYÚSCULAS
function normalizePrismaEnum(str: string | null): string | null {
    if (!str) return null;
    // 1. Convertir a mayúsculas
    const upperStr = str.toUpperCase();
    // 2. Normalizar y remover diacríticos (acentos)
    return upperStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// GET - Listar casos para la bandeja con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    let estado = searchParams.get('estado'); 
    const q = searchParams.get('q') || '';

    const skip = (page - 1) * pageSize;

    // La cláusula `where` final se construye aquí
    const where: any = {};
    // Un array para los bloques de filtros OR/AND que deben combinarse con el operador AND principal.
    const andFilters: any[] = [];

    // --- DEBUGGING: Muestra el valor de estado recibido ---
    console.log('Filtro de Estado Recibido (Original):', estado);
    
    // --- CORRECCIÓN ROBUSTA: Normaliza el estado eliminando acentos y forzando mayúsculas ---
    // Esto asegura que 'EN_REDACCIÓN' -> 'EN_REDACCION' para que coincida con Prisma.
    estado = normalizePrismaEnum(estado); 

    // --- DEBUGGING: Muestra el valor de estado después de la normalización ---
    console.log('Filtro de Estado Normalizado (Prisma):', estado);
    // --------------------------------------------------------------------

    // 1. Filtro por Estado (Se añade directamente al objeto where)
    if (estado && estado !== 'TODOS') {
      where.estado = estado;
    }

    // 2. Filtro de Búsqueda por Texto (Criterio OR)
    if (q) {
      andFilters.push({
        // El bloque OR de búsqueda se añade a la matriz de filtros AND
        OR: [
          { asunto: { contains: q, mode: 'insensitive' } },
          { descripcion: { contains: q, mode: 'insensitive' } },
          { numeroRadicadoEntrada: { contains: q, mode: 'insensitive' } },
          { entidad: { 
              OR: [
                { sigla: { contains: q, mode: 'insensitive' } },
                { nombre: { contains: q, mode: 'insensitive' } }
              ]
            } 
          },
        ],
      });
    }

    // 3. Filtro por Roles (Criterio OR)
    // Si el usuario no es admin, filtramos por casos donde sea responsable o creador
    if (session.user.role !== 'ADMINISTRADOR_SISTEMA' && session.user.role !== 'ADMINISTRADOR_ASIGNACIONES') {
      // El bloque OR de roles se añade a la matriz de filtros AND
      andFilters.push({
        OR: [
          { responsableId: session.user.id },
          { creadorId: session.user.id }
        ]
      });
    }
    
    // 4. Aplicar todos los bloques OR combinados usando el operador AND
    if (andFilters.length > 0) {
        where.AND = andFilters;
    }

    // Obtener casos con paginación
    const [casos, totalCasos] = await Promise.all([
      prisma.caso.findMany({
        where, // Usamos la cláusula where correctamente construida
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
              email: true
            }
          },
          creador: {
            select: {
              name: true,
              email: true
            }
          },
          email: {
            select: {
              from: true,
              subject: true,
              fecha: true
            }
          }
        },
        orderBy: {
          fechaRecepcion: 'desc'
        },
        skip,
        take: pageSize,
      }),
      prisma.caso.count({ where })
    ]);

    // Formatear la respuesta para la bandeja
    const casosFormateados = casos.map(caso => ({
      id: caso.id,
      radicado: caso.numeroRadicadoEntrada || `C-${caso.id.slice(-8)}`,
      entidadSigla: caso.entidad.sigla,
      entidadNombre: caso.entidad.nombre,
      asunto: caso.asunto,
      estado: caso.estado,
      fechaRecepcion: caso.fechaRecepcion,
      fechaVencimiento: caso.fechaVencimiento,
      responsable: caso.responsable?.name || caso.creador?.name || 'Sin asignar',
      entidadColor: caso.entidad.color || '#6B7280',
      // Información del email si existe
      emailFrom: caso.email?.from,
      emailSubject: caso.email?.subject
    }));

    const totalPages = Math.ceil(totalCasos / pageSize);

    return NextResponse.json({
      casos: casosFormateados,
      currentPage: page,
      pageSize,
      totalCasos,
      totalPages,
    });

  } catch (error) {
    console.error('Error obteniendo casos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}