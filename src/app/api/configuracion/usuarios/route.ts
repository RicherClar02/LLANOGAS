// src/app/api/configuracion/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cargo: true,
        proceso: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        fechaInactivacion: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar los datos para que coincidan con la interfaz esperada
    const usuariosTransformados = usuarios.map(usuario => ({
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      cargo: usuario.cargo,
      proceso: usuario.proceso,
      estado: usuario.activo ? 'ACTIVO' : 'INACTIVO',
      fechaCreacion: usuario.createdAt,
      ultimoAcceso: usuario.updatedAt, // Usar updatedAt como último acceso
      fechaInactivacion: usuario.fechaInactivacion
    }));

    return NextResponse.json(usuariosTransformados);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, cargo, proceso, estado } = await request.json();

    // Validar campos requeridos
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y rol son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const usuario = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        cargo,
        proceso,
        activo: estado === 'INACTIVO' ? false : true // Convertir 'ACTIVO'/'INACTIVO' a boolean
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cargo: true,
        proceso: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transformar la respuesta
    const usuarioTransformado = {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      cargo: usuario.cargo,
      proceso: usuario.proceso,
      estado: usuario.activo ? 'ACTIVO' : 'INACTIVO',
      fechaCreacion: usuario.createdAt,
      ultimoAcceso: usuario.updatedAt
    };

    return NextResponse.json(usuarioTransformado, { status: 201 });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, email, password, role, cargo, proceso, estado } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      name,
      email,
      role,
      cargo,
      proceso,
      activo: estado === 'INACTIVO' ? false : true // Convertir 'ACTIVO'/'INACTIVO' a boolean
    };

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cargo: true,
        proceso: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transformar la respuesta
    const usuarioTransformado = {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      cargo: usuario.cargo,
      proceso: usuario.proceso,
      estado: usuario.activo ? 'ACTIVO' : 'INACTIVO',
      fechaCreacion: usuario.createdAt,
      ultimoAcceso: usuario.updatedAt
    };

    return NextResponse.json(usuarioTransformado);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      );
    }

    // Inactivar usuario en lugar de eliminarlo
    const usuario = await prisma.user.update({
      where: { id },
      data: {
        activo: false,
        fechaInactivacion: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cargo: true,
        proceso: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        fechaInactivacion: true
      }
    });

    // Transformar la respuesta
    const usuarioTransformado = {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      cargo: usuario.cargo,
      proceso: usuario.proceso,
      estado: usuario.activo ? 'ACTIVO' : 'INACTIVO',
      fechaCreacion: usuario.createdAt,
      ultimoAcceso: usuario.updatedAt,
      fechaInactivacion: usuario.fechaInactivacion
    };

    return NextResponse.json({ 
      mensaje: 'Usuario inactivado correctamente',
      usuario: usuarioTransformado
    });
  } catch (error) {
    console.error('Error inactivando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}