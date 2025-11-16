import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // O usa tu redirect URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailData) {
  try {
    // Obtener un nuevo access token si es necesario
    const { token } = await oauth2Client.getAccessToken();
    
    if (!token) {
      throw new Error('No se pudo obtener el token de acceso');
    }

    // Crear el mensaje en formato base64
    const message = [
      `From: "${process.env.LLANOGAS_EMAIL}" <${process.env.LLANOGAS_EMAIL}>`,
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      html
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Enviar el email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('Email enviado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
}

// Función para enviar notificaciones de casos
export async function sendCaseNotification(
  to: string, 
  caseId: string, 
  caseSubject: string, 
  action: string
) {
  const subject = `Notificación de Caso - ${action}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
        .button { background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sistema de Gestión de Casos</h1>
        </div>
        <div class="content">
          <h2>${action}</h2>
          <p><strong>ID del Caso:</strong> ${caseId}</p>
          <p><strong>Asunto:</strong> ${caseSubject}</p>
          <p><strong>Acción:</strong> ${action}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <br>
          <a href="${process.env.NEXTAUTH_URL}/dashboard/bandeja/${caseId}" class="button">
            Ver Detalles del Caso
          </a>
        </div>
        <div class="footer">
          <p>Este es un mensaje automático, por favor no responder.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
}