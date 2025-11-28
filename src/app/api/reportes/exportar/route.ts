import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

// 1. FUNCIÓN CENTRAL DE CONSULTA (Adaptada de tu código original)
async function getFilteredEmails(searchParams: URLSearchParams) {
    
    // Obtener parámetros sin paginación
    const search = searchParams.get('search') || '';
    const entidad = searchParams.get('entidad') || '';
    const conRadicado = searchParams.get('conRadicado');
    const dominio = searchParams.get('dominio') || '';
    const prioridad = searchParams.get('prioridad') || '';

    // Construir filtros (igual que tu código original)
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

    // Obtener TODOS los emails que coinciden con los filtros (sin skip/take)
    const emails = await prisma.email.findMany({
        where,
        include: {
            caso: {
                include: {
                    entidad: {
                        select: { sigla: true, nombre: true, color: true }
                    },
                    responsable: {
                        select: { name: true, email: true, cargo: true }
                    }
                }
            }
        },
        orderBy: {
            fecha: 'desc'
        },
    });

    // Formatear los emails con la misma lógica de tu código original
    return emails.map(email => ({
        id: email.id,
        radicado: email.numeroRadicado || 'N/A',
        asunto: email.subject,
        remitente: email.remitenteOriginal || email.from,
        emailRemitente: email.from,
        entidadDetectada: email.entidadDetectada,
        prioridad: email.prioridadDetectada,
        fecha: email.fecha.toISOString().split('T')[0], // Formato de fecha para Excel
        // Información del Caso
        estadoCaso: email.caso ? email.caso.estado : 'Sin Caso',
        responsableCaso: email.caso?.responsable?.name || 'Sin asignar',
        entidadCaso: email.caso?.entidad?.sigla || 'N/A',
    }));
}


// 2. API ROUTE HANDLER (GET)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        
        // Obtener datos filtrados
        const data = await getFilteredEmails(searchParams);

        if (data.length === 0) {
            return NextResponse.json({ error: 'No hay emails que coincidan con los filtros para exportar.' }, { status: 404 });
        }
        
        // 3. GENERACIÓN DEL ARCHIVO EXCEL
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Bandeja de Correos');

        // Definir encabezados de columna
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'RADICADO', key: 'radicado', width: 15 },
            { header: 'ASUNTO', key: 'asunto', width: 60 },
            { header: 'REMITENTE', key: 'remitente', width: 30 },
            { header: 'EMAIL REMITENTE', key: 'emailRemitente', width: 35 },
            { header: 'ENTIDAD DETECTADA', key: 'entidadDetectada', width: 25 },
            { header: 'PRIORIDAD', key: 'prioridad', width: 15 },
            { header: 'FECHA RECEPCIÓN', key: 'fecha', width: 20 },
            { header: 'ESTADO CASO', key: 'estadoCaso', width: 15 },
            { header: 'RESPONSABLE CASO', key: 'responsableCaso', width: 25 },
        ];

        // Añadir datos al archivo
        sheet.addRows(data);
        
        // Generar el Buffer
        const arrayBuffer = await workbook.xlsx.writeBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer); // Convertir a Uint8Array (compatible con NextResponse)
        
        const fileExtension = 'xlsx';
        const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        // 4. DEVOLVER LA RESPUESTA BINARIA
        return new NextResponse(fileBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="reporte-emails-${new Date().toISOString().split('T')[0]}.${fileExtension}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Error exportando emails a Excel:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al generar el Excel' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}