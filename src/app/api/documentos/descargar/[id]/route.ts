// src/app/api/documentos/descargar/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as fs from 'fs'; 
import * as path from 'path'; 


const prisma = new PrismaClient();

// Definición de la interfaz para tipado de parámetros de ruta (para resolver ts(2552))
interface RouteParams {
    params: {
        id: string; 
    };
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    
    // Solución al error 'sync-dynamic-apis'
    await new Promise(resolve => resolve(null)); 
    
    // Obtener el ID del pathname (solución robusta)
    const pathname = request.nextUrl.pathname;
    const pathnameParts = pathname.split('/');
    const documentoId = pathnameParts[pathnameParts.length - 1]; 

    let documento: any;
    let fileBuffer: Buffer;

    try {
        const session = await getServerSession(authOptions); 
        
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener el Documento
        documento = await prisma.documento.findUnique({
            where: { id: documentoId } 
        });

        if (!documento) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        // Usar el campo 'url' (ruta relativa: /uploads/archivo.pdf)
        const rutaRelativa = documento.url as string; 
        
        if (!rutaRelativa) {
             console.error(`Documento ${documentoId} no tiene URL/ruta de almacenamiento.`);
             return NextResponse.json({ error: 'Ruta de archivo no definida.' }, { status: 500 });
        }
        
        // --- LECTURA DEL ARCHIVO ---
        
        const pathSegments = rutaRelativa.startsWith('/') ? rutaRelativa.substring(1) : rutaRelativa;

        // Construcción de la ruta: {proyecto}/uploads/archivo.pdf
        const fullPath = path.join(process.cwd(), pathSegments); 
        
        try {
            // Leer el archivo en un Buffer
            fileBuffer = fs.readFileSync(fullPath);
        } catch (e: any) {
            // Maneja el error ENOENT (Archivo no encontrado)
            console.error(`Error de lectura de archivo (${e.code}): ${fullPath}`, e);
            
            if (e.code === 'ENOENT') {
                return NextResponse.json(
                    { error: `Error al descargar el documento. Archivo no encontrado en la ruta esperada.` }, 
                    { status: 404 }
                );
            }
            
            throw e;
        }

        // --- PREPARACIÓN Y ENVÍO DE RESPUESTA (Solución al error del fileBuffer) ---
        
        // Convertir el Buffer a ReadableStream para ser un BodyInit válido para NextResponse
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(fileBuffer);
                controller.close();
            },
        });

        const fileMimeType = documento.mimeType || 'application/octet-stream'; 
        const fileSize = fileBuffer.length.toString(); 
        
        return new NextResponse(stream, { 
            status: 200,
            headers: {
                'Content-Type': fileMimeType,
                'Content-Disposition': `attachment; filename="${documento.nombre}"`,
                'Content-Length': fileSize,
            },
        });

    } catch (error) {
        console.error('Error interno inesperado en descarga:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}