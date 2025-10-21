// src/app/api/entidades/route.ts
// API para obtener la lista de entidades
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const entidades = await prisma.entidad.findMany({
      select: {
        id: true,
        nombre: true,
        sigla: true,
        color: true,
        email: true,
        descripcion: true
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