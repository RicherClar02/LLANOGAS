// src/app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendCaseNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, type, caseId, caseSubject, action } = body;

    if (type === 'case_notification') {
      if (!to || !caseId || !caseSubject || !action) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos para notificación de caso' },
          { status: 400 }
        );
      }

      await sendCaseNotification(to, caseId, caseSubject, action);
    } else {
      // Email genérico
      if (!to || !subject || !html) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        );
      }

      await sendEmail({ to, subject, html, text });
    }

    return NextResponse.json({ message: 'Email enviado exitosamente' });
  } catch (error) {
    console.error('Error en API de email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al enviar email' },
      { status: 500 }
    );
  }
}