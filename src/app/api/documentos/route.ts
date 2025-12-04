// src/app/api/documentos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as fs from 'fs'; 
import * as path from 'path';

const prisma = new PrismaClient();

// GET - Obtener documentos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const search = searchParams.get('search');

    // Construir filtros
    const where: any = {};

    if (tipo && tipo !== 'todos') {
      where.tipo = tipo;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { caso: { 
            OR: [
              { asunto: { contains: search, mode: 'insensitive' } },
              { numeroRadicadoEntrada: { contains: search, mode: 'insensitive' } }
            ]
          } 
        }
      ];
    }

    const documentos = await prisma.documento.findMany({
      where,
      include: {
        usuario: {
          select: {
            name: true,
            email: true
          }
        },
        caso: {
          select: {
            id: true,
            asunto: true,
            numeroRadicadoEntrada: true,
            entidad: {
              select: {
                sigla: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Formatear respuesta según tu esquema
    const documentosFormateados = documentos.map(doc => ({
      id: doc.id,
      nombre: doc.nombre,
      tipo: doc.tipo,
      formato: doc.url.split('.').pop() || 'pdf', // Inferir formato de la URL
      tamaño: doc.tamano ? `${(doc.tamano / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
      fechaCreacion: doc.createdAt.toISOString().split('T')[0],
      fechaModificacion: doc.updatedAt.toISOString().split('T')[0],
      creadoPor: {
        name: doc.usuario.name || 'Usuario',
        email: doc.usuario.email
      },
      casoId: doc.caso?.numeroRadicadoEntrada,
      entidad: doc.caso?.entidad?.sigla,
      etiquetas: [doc.tipo, doc.esPlantilla ? 'plantilla' : 'documento'],
      url: doc.url,
      esPlantilla: doc.esPlantilla,
      version: doc.version
    }));

    return NextResponse.json(documentosFormateados);

  } catch (error) {
    console.error('Error obteniendo documentos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as string;
    const casoId = formData.get('casoId') as string;
    const esPlantilla = formData.get('esPlantilla') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    // Obtener usuario
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 💾 LÓGICA DE ALMACENAMIENTO FÍSICO (¡BLOQUE FALTANTE AGREGADO!)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name}`;
    const relativeUrl = `/uploads/${filename}`;
    
    // Ruta absoluta: {proyecto}/uploads
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, filename);

    try {
        // Crear el directorio 'uploads' si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Escribir el archivo en el disco
        fs.writeFileSync(filePath, buffer);

    } catch (fsError) {
        console.error('Error al guardar archivo en disco:', fsError);
        // Devuelve 500 si falla la escritura en disco
        return NextResponse.json(
            { error: 'Error al guardar el archivo en el servidor. Revise permisos.' }, 
            { status: 500 }
        );
    }
    // -------------------------------------------------------------

    // Crear documento en la base de datos
    const documento = await prisma.documento.create({
      data: {
        nombre: file.name,
        tipo: tipo || 'anexo',
        url: relativeUrl, // Usamos la URL generada a partir de la ruta guardada
        mimeType: file.type, // Es útil guardar el tipo MIME
        tamano: file.size,
        esPlantilla: esPlantilla,
        usuario: {
          connect: { id: usuario.id }
        },
        ...(casoId && {
          caso: {
            connect: { id: casoId }
          }
        })
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true
          }
        },
        caso: {
          select: {
            numeroRadicadoEntrada: true,
            entidad: {
              select: {
                sigla: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        nombre: documento.nombre,
        tipo: documento.tipo,
        formato: documento.url.split('.').pop() || 'pdf',
        tamaño: documento.tamano ? `${(documento.tamano / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
        fechaCreacion: documento.createdAt.toISOString().split('T')[0],
        fechaModificacion: documento.updatedAt.toISOString().split('T')[0],
        creadoPor: {
          name: documento.usuario.name || 'Usuario',
          email: documento.usuario.email
        },
        casoId: documento.caso?.numeroRadicadoEntrada,
        entidad: documento.caso?.entidad?.sigla,
        etiquetas: [documento.tipo, documento.esPlantilla ? 'plantilla' : 'documento'],
        url: documento.url,
        esPlantilla: documento.esPlantilla
      }
    });

  } catch (error) {
    console.error('Error subiendo documento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}