import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// Interfaz para los parámetros de la ruta
interface RouteParams {
  params: {
    filename: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { filename } = params;
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Nombre de archivo requerido' },
        { status: 400 }
      );
    }

    // 🚀 Diferente ruta según ambiente
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? join(tmpdir(), 'uploads')  // Railway: /tmp/uploads
      : join(process.cwd(), 'uploads');  // Local: ./uploads
    
    const filePath = join(uploadDir, filename);
    
    // Verificar que el archivo existe
    if (!existsSync(filePath)) {
      console.error(`Archivo no encontrado: ${filePath}`);
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }
    
    // Leer archivo
    const fileBuffer = await readFile(filePath);
    
    // Determinar content-type basado en extensión
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      'rar': 'application/vnd.rar',
    };
    
    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';
    
    // Crear stream para la respuesta
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(fileBuffer);
        controller.close();
      },
    });
    
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${decodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
      },
    });
    
  } catch (error: any) {
    console.error('Error sirviendo archivo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', detalle: error.message },
      { status: 500 }
    );
  }
}