// src/app/api/email/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { parseEmailContent } from '@/lib/email-parser';

// Configuración de OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Función para decodificar el cuerpo del email
function decodeEmailBody(body: string, encoding: string = 'base64') {
  if (encoding === 'base64') {
    return Buffer.from(body, 'base64').toString('utf-8');
  }
  return body;
}

// Función para extraer texto del email
function extractEmailText(parts: any[]): string {
  let text = '';

  for (const part of parts) {
    if (part.parts) {
      text += extractEmailText(part.parts);
    } else {
      if (part.mimeType === 'text/plain') {
        text += decodeEmailBody(part.body.data) + '\n';
      } else if (part.mimeType === 'text/html') {
        // Opcional: puedes usar una librería como 'html-to-text' para extraer texto limpio
        const htmlContent = decodeEmailBody(part.body.data);
        text += htmlContent.replace(/<[^>]*>/g, '') + '\n';
      }
    }
  }

  return text;
}

// Función para procesar un email individual
async function processSingleEmail(messageId: string) {
  try {
    // Obtener el email completo
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const email = message.data;
    
    // Extraer información del encabezado
    const headers = email.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find(header => header.name?.toLowerCase() === name.toLowerCase())?.value;

    const from = getHeader('from');
    const subject = getHeader('subject');
    const date = getHeader('date');

    // Extraer el cuerpo del email
    let bodyText = '';
    
    if (email.payload?.parts) {
      bodyText = extractEmailText(email.payload.parts);
    } else if (email.payload?.body?.data) {
      bodyText = decodeEmailBody(email.payload.body.data);
    }

    // Parsear el contenido del email para extraer información estructurada
    const parsedData = await parseEmailContent({
      from: from || '',
      subject: subject || '',
      body: bodyText,
      date: date || new Date().toISOString()
    });

    // Aquí deberías guardar en tu base de datos
    const caseData = {
      radicado: generateRadicado(), // Función para generar número de radicado
      entidad: parsedData.entidad || from?.split('@')[1]?.split('.')[0] || 'Desconocida',
      asunto: parsedData.asunto || subject,
      responsable: parsedData.responsable || 'Por asignar',
      vencimiento: parsedData.vencimiento || calculateDueDate(new Date()), // +15 días
      estado: 'Nuevo',
      emailOriginal: {
        messageId,
        from,
        subject,
        date,
        body: bodyText
      }
    };

    // Guardar en base de datos (aquí debes implementar según tu DB)
    await saveCaseToDatabase(caseData);

    return caseData;

  } catch (error) {
    console.error('Error procesando email:', error);
    throw error;
  }
}

// Función para buscar nuevos emails
async function checkNewEmails() {
  try {
    // Buscar emails no leídos o con label específico
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread', // o tu criterio específico
      maxResults: 10
    });

    const messages = response.data.messages || [];
    const processedCases = [];

    for (const message of messages) {
      if (message.id) {
        const caseData = await processSingleEmail(message.id);
        processedCases.push(caseData);

        // Marcar como leído
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      }
    }

    return processedCases;

  } catch (error) {
    console.error('Error buscando nuevos emails:', error);
    throw error;
  }
}

// Funciones auxiliares (debes implementarlas según tu sistema)
function generateRadicado(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RAD-${timestamp}-${random}`;
}

function calculateDueDate(fromDate: Date): string {
  const dueDate = new Date(fromDate);
  dueDate.setDate(dueDate.getDate() + 15); // +15 días
  return dueDate.toISOString().split('T')[0];
}

async function saveCaseToDatabase(caseData: any) {
  // Implementar según tu base de datos (Prisma, MongoDB, etc.)
  console.log('Guardando caso:', caseData);
  // Ejemplo:
  // return await prisma.case.create({ data: caseData });
}

// Endpoint principal
export async function POST(request: NextRequest) {
  try {
    const { action = 'check' } = await request.json();

    if (action === 'check') {
      const processedCases = await checkNewEmails();
      
      return NextResponse.json({
        message: `Procesados ${processedCases.length} nuevos emails`,
        cases: processedCases
      });
    } else if (action === 'process-single') {
      const { messageId } = await request.json();
      
      if (!messageId) {
        return NextResponse.json(
          { error: 'messageId es requerido' },
          { status: 400 }
        );
      }

      const caseData = await processSingleEmail(messageId);
      
      return NextResponse.json({
        message: 'Email procesado exitosamente',
        case: caseData
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en API de procesamiento de email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar emails' },
      { status: 500 }
    );
  }
}

// Endpoint para configurar webhook (push notifications)
export async function GET(request: NextRequest) {
  try {
    // Para webhook verification de Gmail
    const searchParams = request.nextUrl.searchParams;
    const challenge = searchParams.get('challenge');
    
    if (challenge) {
      return new NextResponse(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    return NextResponse.json({
      message: 'API de procesamiento de email funcionando'
    });

  } catch (error) {
    console.error('Error en GET de procesamiento de email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}