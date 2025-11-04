// src/app/api/entidades/route.ts
// API para gestionar entidades
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Obtener todas las entidades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const entidades = await prisma.entidad.findMany({
      where: {
        activo: true
      },
      include: {
        responsablePorDefecto: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            casos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json({ entidades });
  } catch (error) {
    console.error('Error al obtener entidades:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva entidad
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMINISTRADOR_SISTEMA') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      nombre, 
      sigla, 
      email, 
      descripcion, 
      color, 
      dominiosCorreo, 
      palabrasClave, 
      tiempoRespuestaDias,
      responsablePorDefectoId 
    } = body;

    // Validaciones
    if (!nombre || !sigla || !color) {
      return NextResponse.json(
        { error: 'Nombre, sigla y color son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una entidad con ese nombre o sigla
    const entidadExistente = await prisma.entidad.findFirst({
      where: {
        OR: [
          { nombre },
          { sigla }
        ]
      }
    });

    if (entidadExistente) {
      return NextResponse.json(
        { error: 'Ya existe una entidad con ese nombre o sigla' },
        { status: 409 }
      );
    }

    const nuevaEntidad = await prisma.entidad.create({
      data: {
        nombre,
        sigla,
        email,
        descripcion,
        color,
        dominiosCorreo: dominiosCorreo || [],
        palabrasClave: palabrasClave || [],
        tiempoRespuestaDias: tiempoRespuestaDias || 15,
        responsablePorDefectoId
      },
      include: {
        responsablePorDefecto: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(
      { 
        entidad: nuevaEntidad, 
        message: 'Entidad creada exitosamente' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear entidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}