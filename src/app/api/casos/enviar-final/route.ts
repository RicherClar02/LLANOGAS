//src/app/api/casos/enviar-final/route.ts

import { NextResponse } from 'next/server';
// Asegúrate de que esta importación use la ruta relativa correcta
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
  const { casoId } = params;

  // --- OBTENER ID DEL USUARIO SOLICITANTE/GESTOR ---
  // TEMPORAL: Reemplaza esto con el ID del usuario autenticado (GESTOR/ADMIN).
  const usuarioId = "ID_DEL_GESTOR_SOLICITANTE"; 

  try {
    // 1. VERIFICACIÓN: Validar que el caso exista y esté listo para el envío.
    const casoActual = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { estado: true },
    });

    if (!casoActual || casoActual.estado !== EstadoCaso.FIRMA_LEGAL) {
      // El caso debe estar en estado FIRMA_LEGAL para ser enviado.
      return NextResponse.json(
        { message: 'El caso no está en la etapa de Firma Legal o ya fue enviado.' },
        { status: 400 }
      );
    }

    // --- PASO 2: INICIAR LA TRANSACCIÓN DE ENVÍO FINAL ---
    const transaction = await prisma.$transaction(async (tx) => {
      
      // 2.1. Actualizar el estado del Caso: De FIRMA_LEGAL a ENVIADO
      await tx.caso.update({
        where: { id: casoId },
        data: {
          estado: EstadoCaso.ENVIADO, // El caso ha sido enviado por correo certificado
          etapaAprobacion: EtapaAprobacion.ENVIADO,
          fechaFirmaLegal: new Date(), // Marcamos la fecha de la firma
          fechaEnvioFinal: new Date(), // Marcamos la fecha del envío final
          // También se podría registrar el número de radicado de salida aquí
        },
      });

      // 2.2. Registrar la actividad (Auditoría)
      await tx.actividad.create({
        data: {
          casoId: casoId,
          usuarioId: usuarioId,
          tipo: TipoActividad.ENVIO_FINAL,
          descripcion: 'Documento firmado y enviado a Recepción para envío por correo certificado (Servientrega).',
        },
      });

      return { nuevoEstado: EstadoCaso.ENVIADO };
    });

    return NextResponse.json(
      { 
        message: 'Caso finalizado, marcado como ENVIADO y se registraron las fechas de firma y envío.', 
        ...transaction 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al finalizar el caso:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}