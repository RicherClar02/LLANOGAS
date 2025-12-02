// src/app/api/documentos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as fs from 'fs'; 
import * as path from 'path'; 

const prisma = new PrismaClient();

// GET - Obtener la lista de documentos (filtrado/búsqueda)
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
                }}
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

        // Formatear respuesta
        const documentosFormateados = documentos.map(doc => ({
            id: doc.id,
            nombre: doc.nombre,
            tipo: doc.tipo,
            formato: doc.url.split('.').pop() || 'pdf',
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

// POST - Subir documento (Con lógica de guardado físico)
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

        // 💾 LÓGICA DE ALMACENAMIENTO FÍSICO
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${Date.now()}-${file.name}`;
        const relativeUrl = `/uploads/${filename}`;
        
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
            return NextResponse.json(
                { error: 'Error al guardar el archivo en el servidor.' }, 
                { status: 500 }
            );
        }

        // Crear documento en la base de datos
        const documento = await prisma.documento.create({
            data: {
                nombre: file.name,
                tipo: tipo || 'anexo',
                url: relativeUrl,
                mimeType: file.type, 
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

// DELETE - Eliminar documento (Base de datos y archivo físico)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let rutaRelativa: string | null = null;

    try {
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 1. Encontrar el documento para obtener la URL del archivo
        const documento = await prisma.documento.findUnique({
            where: { id: params.id }
        });

        if (!documento) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }
        
        // Guardamos la ruta relativa antes de eliminar el registro de la DB
        rutaRelativa = documento.url; 

        // 2. Eliminar el registro de la base de datos (Prisma)
        await prisma.documento.delete({
            where: { id: params.id }
        });
        
        // 3. Eliminar el archivo físico del disco
        if (rutaRelativa) {
            const pathSegments = rutaRelativa.startsWith('/') ? rutaRelativa.substring(1) : rutaRelativa;
            const fullPath = path.join(process.cwd(), pathSegments);
            
            try {
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath); 
                    console.log(`Archivo eliminado con éxito: ${fullPath}`);
                } else {
                    console.warn(`Advertencia: Archivo físico no encontrado en el disco para la ruta: ${fullPath}`);
                }
            } catch (fsError) {
                console.error(`Error al intentar eliminar archivo físico ${fullPath}:`, fsError);
            }
        }

        return NextResponse.json({ success: true, message: 'Documento y archivo eliminados correctamente.' });

    } catch (error) {
        console.error('Error eliminando documento:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}