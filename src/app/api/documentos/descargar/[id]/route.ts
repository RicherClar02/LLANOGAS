import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

// Interfaz para parámetros de ruta
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
  await new Promise(resolve => setTimeout(resolve, 0));
  
  try {
    const session = await getServerSession(authOptions); 
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    // Obtener el Documento
    const documento = await prisma.documento.findUnique({
      where: { id }
    });

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Extraer nombre de archivo de la URL
    const url = documento.url as string;
    
    // 🚀 CORRECCIÓN: Manejar diferentes formatos de URL
    let filename: string;
    
    if (url.includes('/api/uploads/')) {
      // URL nueva: /api/uploads/filename.ext
      filename = url.split('/').pop() || '';
    } else if (url.includes('/uploads/')) {
      // URL antigua: /uploads/filename.ext
      filename = url.split('/').pop() || '';
    } else {
      // URL directa
      filename = url;
    }
    
    if (!filename) {
      console.error(`Documento ${id} no tiene URL/ruta válida: ${url}`);
      return NextResponse.json({ error: 'Ruta de archivo no definida.' }, { status: 500 });
    }
    
    // --- LECTURA DEL ARCHIVO ---
    // 🚀 CORRECCIÓN: Diferentes rutas según ambiente
    let filePath: string;
    
    if (process.env.NODE_ENV === 'production') {
      // Railway: buscar en /tmp/uploads
      filePath = join(tmpdir(), 'uploads', filename);
    } else {
      // Desarrollo local: buscar en ./uploads
      filePath = join(process.cwd(), 'uploads', filename);
    }
    
    // Verificar que el archivo existe
    if (!existsSync(filePath)) {
      console.error(`Archivo no encontrado en: ${filePath}`);
      console.error(`Buscando archivo: ${filename}`);
      console.error(`URL del documento: ${url}`);
      
      return NextResponse.json(
        { 
          error: 'Error al descargar el documento. Archivo no encontrado.',
          detalle: `Ruta: ${filePath}`
        }, 
        { status: 404 }
      );
    }

    // Leer el archivo
    const fileBuffer = await readFile(filePath);
    
    // Convertir Buffer a ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(fileBuffer);
        controller.close();
      },
    });

    const fileMimeType = documento.mimeType || 'application/octet-stream';
    
    return new NextResponse(stream, { 
      status: 200,
      headers: {
        'Content-Type': fileMimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(documento.nombre)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Error interno en descarga:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalle: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}