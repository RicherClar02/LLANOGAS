import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    
    await sendEmail({
      to: to || 'richerclarosdiaz@gmail.com',
      subject: 'Prueba de Email - Sistema de Casos',
      html: `
        <h1>¡Email de prueba exitoso! 🎉</h1>
        <p>Este es un email de prueba del sistema de gestión de casos.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
        <p>Si recibes este email, la configuración está funcionando correctamente.</p>
      `
    });

    return NextResponse.json({ 
      message: 'Email de prueba enviado exitosamente' 
    });
  } catch (error) {
    console.error('Error en prueba de email:', error);
    return NextResponse.json(
      { error: 'Error enviando email de prueba' },
      { status: 500 }
    );
  }
}