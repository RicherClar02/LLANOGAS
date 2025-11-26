//src/app/api/casos/cerrar-final/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';  
import { 
  EstadoCaso, 
  TipoActividad, 
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

    // 1. VERIFICACIÓN: Validar que el caso exista y obtener datos necesarios para el email.
    const casoActual = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { 
        id: true,
        estado: true,
        etapaAprobacion: true,
        // Campos necesarios para el email
        asunto: true,
        responsable: {
          select: {
            email: true, // Email del responsable asignado al caso
          },
        },
      },
    });

    if (!casoActual) {
      return NextResponse.json(
        { message: 'Caso no encontrado' },
        { status: 404 }
      );
    }

    if (casoActual.estado !== EstadoCaso.ENVIADO) {
      return NextResponse.json(
        { 
          message: `El caso debe estar en estado ENVIADO para proceder al cierre. Estado actual: ${casoActual.estado}.` 
        },
        { status: 400 }
      );
    }

    // --- PASO 2: INICIAR LA TRANSACCIÓN DE CIERRE ---
    const transaction = await prisma.$transaction(async (tx) => {
      
      // 2.1. TRANSICIÓN A: REGISTRAR ACUSE DE RECIBO
      // Actualizar el caso a estado CON_ACUSE
      await tx.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.CON_ACUSE,
          etapaAprobacion: EtapaAprobacion.CON_ACUSE,
          fechaAcuseRecibo: new Date(),
        },
      });

      // Registrar actividad de Acuse de Recibo
      await tx.actividad.create({
        data: {
          casoId: casoId,
          usuarioId: usuarioId,
          tipo: TipoActividad.ACUSE_RECIBO,
          descripcion: 'Acuse de recibo del comunicado final registrado.',
        },
      });
      
      // 2.2. TRANSICIÓN B: CERRAR EL CASO
      // Actualizar el caso a estado CERRADO
      await tx.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.CERRADO,
          etapaAprobacion: EtapaAprobacion.CERRADO,
          fechaCierre: new Date(),
        },
      });

      // Registrar actividad de Cierre
      await tx.actividad.create({
        data: {
          casoId: casoId,
          usuarioId: usuarioId,
          tipo: TipoActividad.CAMBIO_ESTADO,
          descripcion: 'Caso cerrado y archivado de forma definitiva.',
        },
      });
      
      // 2.3. ENVIAR NOTIFICACIÓN POR EMAIL (Fuera del manejo de transacciones de DB)
      try {
        // Se utiliza el email del responsable, o por defecto el email del usuario que cierra
        const recipientEmail = casoActual.responsable?.email || session.user.email;
        
        await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Opcional: Podrías necesitar una clave de API interna si la ruta de email es protegida
          },
          body: JSON.stringify({
            type: 'case_notification',
            to: recipientEmail,
            caseId: casoId,
            caseSubject: casoActual.asunto,
            action: 'Caso Cerrado Exitosamente'
          }),
        });
      } catch (emailError) {
        // IMPORTANTE: No fallar la transacción principal por un error de email
        console.error('Error enviando notificación por email:', emailError);
      }
      
      return { nuevoEstado: EstadoCaso.CERRADO };
    });

    return NextResponse.json(
      { 
        message: 'Caso cerrado con éxito, Acuse de Recibo registrado y notificación enviada.', 
        ...transaction 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al cerrar el caso:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Error interno del servidor.' 
      },
      { status: 500 }
    );
  }
}