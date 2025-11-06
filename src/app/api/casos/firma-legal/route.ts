import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  EstadoCaso, 
  TipoActividad, 
  EstadoRevision, 
  EtapaAprobacion 
} from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { casoId: string } }
) {
  try {
    const { casoId } = params;
    
    // --- OBTENER USUARIO AUTENTICADO ---
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const usuarioId = session.user.id;

    // --- PASO 2: BUSCAR EL REVISOR JURÍDICO DISPONIBLE ---
    const revisor = await prisma.user.findFirst({
      where: {
        role: 'REVISOR_JURIDICO',
        activo: true,
      },
      select: { id: true, name: true },
    });

    if (!revisor) {
      return NextResponse.json(
        { message: 'Error: No se encontró ningún Revisor Jurídico activo para asignar la revisión.' },
        { status: 404 }
      );
    }

    const revisorJuridicoId = revisor.id;

    // --- PASO 3: INICIAR LA TRANSACCIÓN ---
    const transaction = await prisma.$transaction(async (tx) => {
      // 3.1. Verificar si el caso existe y está en un estado válido
      const caso = await tx.caso.findUnique({
        where: { id: casoId },
        select: { estado: true },
      });

      if (!caso || caso.estado !== EstadoCaso.EN_REDACCION) {
        throw new Error('El caso no existe o no se puede enviar a revisión en su estado actual.');
      }

      // 3.2. Crear el registro de la Solicitud de Revisión Legal
      const revision = await tx.revision.create({
        data: {
          casoId: casoId,
          revisorId: revisorJuridicoId,
          estado: EstadoRevision.PENDIENTE,
        },
      });

      // 3.3. Actualizar el estado del Caso principal
      await tx.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.EN_REVISION,
          etapaAprobacion: EtapaAprobacion.EN_REVISION,
          fechaEnvioRevision: new Date(),
        },
      });

      // 3.4. Registrar la actividad
      await tx.actividad.create({
        data: {
          casoId: casoId,
          usuarioId: usuarioId,
          tipo: TipoActividad.ENVIO_REVISION,
          descripcion: `Caso enviado a revisión legal a ${revisor.name}`,
        },
      });

      return { revisionId: revision.id };
    });

    return NextResponse.json(
      { 
        message: 'Solicitud de revisión legal creada y asignada.', 
        asignadoA: revisor.name, 
        ...transaction 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al solicitar revisión legal:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno al procesar la solicitud.' },
      { status: 500 }
    );
  }
}