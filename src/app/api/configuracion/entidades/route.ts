import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const entidades = await prisma.entidad.findMany({
      include: {
        responsablePorDefecto: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const entidadesFormateadas = entidades.map(entidad => ({
      id: entidad.id,
      nombre: entidad.nombre,
      sigla: entidad.sigla || '',
      color: entidad.color || '#3B82F6',
      dominioCorreo: entidad.email || '',
      tiempoRespuestaDias: entidad.tiempoRespuestaDias || 15,
      palabrasClave: entidad.palabrasClave ? JSON.parse(JSON.stringify(entidad.palabrasClave)) : [],
      responsablePredeterminado: entidad.responsablePorDefecto?.id,
      responsableNombre: entidad.responsablePorDefecto?.name,
      estado: entidad.activo ? 'ACTIVA' : 'INACTIVA' as const,
      sincronizadaBandeja: true, // Por defecto asumimos sincronizada
      dominiosCorreo: entidad.dominiosCorreo ? JSON.parse(JSON.stringify(entidad.dominiosCorreo)) : [],
      descripcion: entidad.descripcion,
      fechaCreacion: entidad.createdAt.toISOString()
    }));

    return NextResponse.json(entidadesFormateadas);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nombre, 
      sigla, 
      color, 
      dominioCorreo, 
      tiempoRespuestaDias, 
      palabrasClave, 
      responsablePredeterminado,
      estado,
      descripcion 
    } = body;

    // Validar campos requeridos
    if (!nombre || !dominioCorreo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre y dominio de correo' },
        { status: 400 }
      );
    }

    // Verificar si la entidad ya existe
    const entidadExistente = await prisma.entidad.findUnique({
      where: { nombre }
    });

    if (entidadExistente) {
      return NextResponse.json(
        { error: 'Ya existe una entidad con este nombre' },
        { status: 400 }
      );
    }

    // Crear entidad
    const nuevaEntidad = await prisma.entidad.create({
      data: {
        nombre,
        sigla,
        color,
        email: dominioCorreo,
        tiempoRespuestaDias: tiempoRespuestaDias || 15,
        palabrasClave: palabrasClave || [],
        responsablePorDefectoId: responsablePredeterminado || null,
        descripcion,
        activo: estado === 'ACTIVA',
        dominiosCorreo: [dominioCorreo]
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

    const entidadRespuesta = {
      id: nuevaEntidad.id,
      nombre: nuevaEntidad.nombre,
      sigla: nuevaEntidad.sigla || '',
      color: nuevaEntidad.color || '#3B82F6',
      dominioCorreo: nuevaEntidad.email || '',
      tiempoRespuestaDias: nuevaEntidad.tiempoRespuestaDias || 15,
      palabrasClave: nuevaEntidad.palabrasClave ? JSON.parse(JSON.stringify(nuevaEntidad.palabrasClave)) : [],
      responsablePredeterminado: nuevaEntidad.responsablePorDefecto?.id,
      responsableNombre: nuevaEntidad.responsablePorDefecto?.name,
      estado: nuevaEntidad.activo ? 'ACTIVA' : 'INACTIVA' as const,
      sincronizadaBandeja: true,
      dominiosCorreo: nuevaEntidad.dominiosCorreo ? JSON.parse(JSON.stringify(nuevaEntidad.dominiosCorreo)) : [],
      descripcion: nuevaEntidad.descripcion,
      fechaCreacion: nuevaEntidad.createdAt.toISOString()
    };

    return NextResponse.json(entidadRespuesta, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      nombre, 
      sigla, 
      color, 
      dominioCorreo, 
      tiempoRespuestaDias, 
      palabrasClave, 
      responsablePredeterminado,
      estado,
      descripcion 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de entidad requerido' },
        { status: 400 }
      );
    }

    // Verificar que la entidad existe
    const entidadExistente = await prisma.entidad.findUnique({
      where: { id }
    });

    if (!entidadExistente) {
      return NextResponse.json(
        { error: 'Entidad no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar entidad
    const entidadActualizada = await prisma.entidad.update({
      where: { id },
      data: {
        nombre,
        sigla,
        color,
        email: dominioCorreo,
        tiempoRespuestaDias: tiempoRespuestaDias || 15,
        palabrasClave: palabrasClave || [],
        responsablePorDefectoId: responsablePredeterminado || null,
        descripcion,
        activo: estado === 'ACTIVA'
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

    const entidadRespuesta = {
      id: entidadActualizada.id,
      nombre: entidadActualizada.nombre,
      sigla: entidadActualizada.sigla || '',
      color: entidadActualizada.color || '#3B82F6',
      dominioCorreo: entidadActualizada.email || '',
      tiempoRespuestaDias: entidadActualizada.tiempoRespuestaDias || 15,
      palabrasClave: entidadActualizada.palabrasClave ? JSON.parse(JSON.stringify(entidadActualizada.palabrasClave)) : [],
      responsablePredeterminado: entidadActualizada.responsablePorDefecto?.id,
      responsableNombre: entidadActualizada.responsablePorDefecto?.name,
      estado: entidadActualizada.activo ? 'ACTIVA' : 'INACTIVA' as const,
      sincronizadaBandeja: true,
      dominiosCorreo: entidadActualizada.dominiosCorreo ? JSON.parse(JSON.stringify(entidadActualizada.dominiosCorreo)) : [],
      descripcion: entidadActualizada.descripcion,
      fechaCreacion: entidadActualizada.createdAt.toISOString()
    };

    return NextResponse.json(entidadRespuesta);
  } catch (error) {
    console.error('Error updating entity:', error);
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
        { error: 'ID de entidad requerido' },
        { status: 400 }
      );
    }

    // Verificar que la entidad existe
    const entidadExistente = await prisma.entidad.findUnique({
      where: { id }
    });

    if (!entidadExistente) {
      return NextResponse.json(
        { error: 'Entidad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay casos asociados
    const casosAsociados = await prisma.caso.count({
      where: { entidadId: id }
    });

    if (casosAsociados > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la entidad porque tiene casos asociados. Inactívela en su lugar.' },
        { status: 400 }
      );
    }

    // Inactivar entidad (soft delete)
    await prisma.entidad.update({
      where: { id },
      data: {
        activo: false
      }
    });

    return NextResponse.json({ message: 'Entidad inactivada correctamente' });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}