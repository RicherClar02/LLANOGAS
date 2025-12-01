// src\app\api\documentos\descargar\[id]\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as fs from 'fs'; 
import * as path from 'path'; 
import { ReadableStream } from 'stream/web'; // Importación para ReadableStream (puede ser implícito en Node 18+)

const prisma = new PrismaClient();

interface RouteParams {
    params: {
        id: string; 
    };
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    
    // 🚀 SOLUCIÓN AL ERROR NEXT.JS: Obtener el ID del pathname
    const pathname = request.nextUrl.pathname;
    const pathnameParts = pathname.split('/');
    const documentoId = pathnameParts[pathnameParts.length - 1]; 
    
    // Mantenemos esto si el error de Next.js es muy persistente
    await new Promise(resolve => resolve(null)); 

    let documento: any;
    let fileBuffer: Buffer;

    try {
        const session = await getServerSession(authOptions); 
        
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 1. Obtener el Documento de Prisma
        documento = await prisma.documento.findUnique({
            where: { id: documentoId } 
        });

        if (!documento) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        // 2. Usar el campo 'url' (que contiene la ruta en tu esquema)
        const rutaRelativa = documento.url as string; // Aseguramos el tipo
        
        if (!rutaRelativa) {
             console.error(`Documento ${documentoId} no tiene URL/ruta de almacenamiento.`);
             return NextResponse.json({ error: 'Ruta de archivo no definida.' }, { status: 500 });
        }
        
        // --- 3. CONSTRUCCIÓN DE LA RUTA Y LECTURA ---
        
        // ADVERTENCIA CRÍTICA: La ruta construida debe coincidir con la que falló (ENOENT).
        // Si el archivo estaba en: C:\Users\santi\Videos\llanogas\LLANOGAS\documentos_storage\uploads\1764623654984-Informe.pdf
        // Y process.cwd() es: C:\Users\santi\Videos\llanogas\LLANOGAS
        // Entonces solo necesitas unir el resto de la ruta relativa.
        
        const fullPath = path.join(process.cwd(), rutaRelativa); 

        try {
            // Intenta leer el archivo
            fileBuffer = fs.readFileSync(fullPath);
        } catch (e: any) {
            // Este catch maneja el error ENOENT
            console.error(`Error de lectura de archivo (${e.code}): ${fullPath}`, e);
            
            if (e.code === 'ENOENT') {
                return NextResponse.json({ error: 'Archivo físico no encontrado en el servidor (Ruta: ' + rutaRelativa + ').' }, { status: 404 });
            }
            
            throw e;
        }

        // --- 4. PREPARACIÓN Y ENVÍO DE RESPUESTA (Usando ReadableStream) ---
        
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(fileBuffer);
                controller.close();
            },
        });

        // Usamos las propiedades del documento y el tamaño real del buffer
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
        // Este catch maneja errores inesperados
        console.error('Error interno inesperado en descarga:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}