// src/services/gmail-sync-service.ts
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import { crearNotificacionNuevoEmail } from '@/lib/notifications';

const prisma = new PrismaClient();

// Configuración de OAuth2 para Gmail
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

interface GmailSyncConfig {
  intervalMinutes?: number;
  maxEmailsPerSync?: number;
  labelToWatch?: string;
  historyId?: string;
}

interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

interface GmailMessagePart {
  mimeType: string;
  filename?: string;
  body: {
    data?: string;
    attachmentId?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
}

interface GmailMessagePayload {
  headers: Array<{ name: string; value: string }>;
  parts?: GmailMessagePart[];
  body?: {
    data?: string;
  };
}

interface GmailMessage {
  id: string;
  payload: GmailMessagePayload;
}

interface DecodedEmailBody {
  text: string;
  html?: string;
}

interface EmailUser {
  id: string;
  role?: string;
}

export class GmailSyncService {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private config: GmailSyncConfig;

  constructor(config: GmailSyncConfig = {}) {
    this.config = {
      intervalMinutes: 5, // Sincronizar cada 5 minutos
      maxEmailsPerSync: 50,
      labelToWatch: 'INBOX',
      ...config
    };
  }

  /**
   * Inicializa y autentica el cliente de Gmail
   */
  private async getGmailClient() {
    try {
      // Usar credenciales de tu .env
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;
      const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

      if (!clientId || !clientSecret) {
        throw new Error('Faltan las credenciales de Gmail en las variables de entorno');
      }

      const auth = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      // Establecer credenciales usando el refresh token
      const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
      if (!refreshToken) {
        throw new Error('Falta el refresh token de Gmail');
      }

      auth.setCredentials({
        refresh_token: refreshToken,
        scope: SCOPES.join(' '),
        token_type: 'Bearer'
      });

      // Obtener nuevo access token si es necesario
      try {
        const { credentials } = await auth.refreshAccessToken();
        auth.setCredentials(credentials);
      } catch (refreshError) {
        console.warn('No se pudo refrescar el access token:', refreshError);
        // Continuar con el refresh token
      }

      return google.gmail({ version: 'v1', auth });
    } catch (error) {
      console.error('Error inicializando cliente Gmail:', error);
      throw error;
    }
  }

  /**
   * Extrae y decodifica el cuerpo del email
   */
  private decodeEmailBody(message: GmailMessage): DecodedEmailBody {
    try {
      let text = '';
      let html = '';

      if (message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body.data) {
            text = Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.mimeType === 'text/html' && part.body.data) {
            html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          
          // Buscar en partes anidadas
          if (part.parts) {
            for (const subPart of part.parts) {
              if (subPart.mimeType === 'text/plain' && subPart.body.data) {
                text = Buffer.from(subPart.body.data, 'base64').toString('utf-8');
              }
              if (subPart.mimeType === 'text/html' && subPart.body.data) {
                html = Buffer.from(subPart.body.data, 'base64').toString('utf-8');
              }
            }
          }
        }
      } else if (message.payload.body?.data) {
        text = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      }

      return { text, html };
    } catch (error) {
      console.error('Error decodificando cuerpo del email:', error);
      return { text: '', html: '' };
    }
  }

  /**
   * Extrae archivos adjuntos
   */
  private extractAttachments(message: GmailMessage): Attachment[] {
    const attachments: Attachment[] = [];
    
    function processParts(parts: GmailMessagePart[]) {
      for (const part of parts) {
        if (part.filename && part.filename.length > 0 && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId
          });
        }
        
        if (part.parts) {
          processParts(part.parts);
        }
      }
    }
    
    if (message.payload.parts) {
      processParts(message.payload.parts);
    }
    
    return attachments;
  }

  /**
   * Extrae número de radicado del asunto o cuerpo
   */
  private extractRadicadoNumber(subject: string, body: string): string | null {
    const radicadoPatterns = [
      /radicado[:\s]*([A-Za-z0-9-]+)/i,
      /rad[:\s]*([A-Za-z0-9-]+)/i,
      /no\.?[:\s]*([A-Za-z0-9-]+)/i,
      /número[:\s]*([A-Za-z0-9-]+)/i,
      /ref[:\s]*([A-Za-z0-9-]+)/i
    ];

    const textToSearch = `${subject} ${body}`;
    
    for (const pattern of radicadoPatterns) {
      const match = textToSearch.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  /**
   * Detecta la entidad basada en el dominio del remitente
   */
  private async detectEntity(emailFrom: string): Promise<string | null> {
    try {
      // Extraer dominio del email
      const domain = emailFrom.split('@')[1]?.toLowerCase();
      if (!domain) return null;

      // Buscar entidad por dominio
      const entidades = await prisma.entidad.findMany({
        where: {
          activo: true
        }
      });

      for (const entidad of entidades) {
        const dominios = entidad.dominiosCorreo as string[] | null;
        if (dominios && Array.isArray(dominios)) {
          if (dominios.some((d: string) => 
            d && domain.includes(d.toLowerCase())
          )) {
            return entidad.id;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error detectando entidad:', error);
      return null;
    }
  }

  /**
   * Procesa un email individual
   */
  private async processEmail(gmail: any, messageId: string) {
    try {
      // Obtener el email completo
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data as GmailMessage;
      
      // Extraer headers
      const headers = message.payload.headers;
      const getHeader = (name: string): string => {
        const header = headers.find((h: { name: string; value: string }) => 
          h.name.toLowerCase() === name.toLowerCase()
        );
        return header?.value || '';
      };

      const from = getHeader('From');
      const to = getHeader('To');
      const subject = getHeader('Subject');
      const date = getHeader('Date') ? new Date(getHeader('Date')) : new Date();
      const messageIdHeader = getHeader('Message-ID');

      // Extraer cuerpo
      const { text: body, html } = this.decodeEmailBody(message);
      
      // Extraer radicado
      const numeroRadicado = this.extractRadicadoNumber(subject, body);
      
      // Extraer dominio y nombre del remitente
      const remitenteMatch = from.match(/(.*)<(.*)>/) || from.match(/(.*)\((.*)\)/);
      const remitenteOriginal = remitenteMatch 
        ? remitenteMatch[1].trim() 
        : from.split('@')[0];
      const dominioRemitente = from.split('@')[1] || '';

      // Extraer palabras clave del asunto
      const palabrasClave = subject
        .toLowerCase()
        .split(/[\s,\-._]+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 10);

      // Detectar si es entidad de control
      const entidadId = await this.detectEntity(from);
      const esEntidadControl = !!entidadId;

      // Verificar si el email ya existe
      const existingEmail = await prisma.email.findUnique({
        where: { messageId }
      });

      if (existingEmail) {
        console.log(`Email ya procesado: ${messageId}`);
        return null;
      }

      // Guardar en la base de datos
      const newEmail = await prisma.email.create({
        data: {
          messageId,
          from,
          to,
          subject,
          body,
          html,
          fecha: date,
          attachments: this.extractAttachments(message) as any,
          entidadDetectada: entidadId || null,
          numeroRadicado,
          remitenteOriginal,
          dominioRemitente,
          palabrasClave,
          esEntidadControl,
          procesado: false,
          clasificado: false,
          notificado: false
        }
      });

      console.log(`Nuevo email guardado: ${messageId} - ${subject}`);
      
      // Obtener administradores para notificar
      const admins = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'ADMINISTRADOR_SISTEMA' },
            { role: 'ADMINISTRADOR_ASIGNACIONES' }
          ],
          activo: true
        }
      });

      // Notificar a cada administrador
      for (const admin of admins) {
        await crearNotificacionNuevoEmail(newEmail, admin.id);
      }

      // Intentar vincular con caso existente
      if (numeroRadicado) {
        await this.linkEmailToCase(newEmail.id, numeroRadicado);
      }

      return newEmail;

    } catch (error) {
      console.error(`Error procesando email ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Vincula email con caso existente por número de radicado
   */
  private async linkEmailToCase(emailId: string, radicadoNumber: string) {
    try {
      const caso = await prisma.caso.findFirst({
        where: {
          OR: [
            { numeroRadicadoEntrada: radicadoNumber },
            { numeroRadicadoSalida: radicadoNumber }
          ]
        }
      });

      if (caso) {
        await prisma.email.update({
          where: { id: emailId },
          data: {
            caso: { connect: { id: caso.id } },
            procesado: true
          }
        });

        console.log(`Email ${emailId} vinculado al caso ${caso.id}`);
        
        // Crear array de condiciones para la consulta de usuarios
        const condicionesUsuario: any[] = [
          { role: 'ADMINISTRADOR_SISTEMA' },
          { role: 'ADMINISTRADOR_ASIGNACIONES' }
        ];

        // Agregar responsable y creador si existen
        if (caso.responsableId) {
          condicionesUsuario.push({ id: caso.responsableId });
        }
        
        if (caso.creadorId && caso.creadorId !== caso.responsableId) {
          condicionesUsuario.push({ id: caso.creadorId });
        }

        // Notificar a los usuarios relacionados con el caso
        const usuariosCaso = await prisma.user.findMany({
          where: {
            OR: condicionesUsuario,
            activo: true
          }
        });

        const email = await prisma.email.findUnique({
          where: { id: emailId }
        });

        for (const usuario of usuariosCaso) {
          if (email) {
            await crearNotificacionNuevoEmail(email, usuario.id);
          }
        }
      }
    } catch (error) {
      console.error('Error vinculando email con caso:', error);
    }
  }

  /**
   * Sincroniza emails de Gmail
   */
  public async syncEmails() {
    if (this.isRunning) {
      console.log('Sincronización ya en progreso...');
      return;
    }

    this.isRunning = true;
    console.log(`Iniciando sincronización de Gmail - ${new Date().toISOString()}`);

    try {
      const gmail = await this.getGmailClient();
      
      // Obtener últimos emails
      const response = await gmail.users.messages.list({
        userId: 'me',
        labelIds: [this.config.labelToWatch!],
        maxResults: this.config.maxEmailsPerSync,
        q: 'is:unread' // Solo emails no leídos
      });

      const messages = response.data.messages || [];
      console.log(`Encontrados ${messages.length} emails nuevos`);

      // Procesar cada email
      for (const message of messages) {
        if (message.id) {
          await this.processEmail(gmail, message.id);
          await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
        }
      }

      // Marcar emails como leídos
      if (messages.length > 0) {
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: messages.map(m => m.id!).filter(Boolean),
            removeLabelIds: ['UNREAD']
          }
        });
      }

    } catch (error: any) {
      console.error('Error en sincronización de Gmail:', error);
      
      // Si el error es de autenticación, intentar refrescar token
      if (error.code === 401 || error.message?.includes('Invalid Credentials')) {
        console.log('Token expirado, intentando refrescar...');
        // Aquí podrías implementar lógica para refrescar el token automáticamente
      }
    } finally {
      this.isRunning = false;
      console.log(`Sincronización completada - ${new Date().toISOString()}`);
    }
  }

  /**
   * Inicia el servicio de sincronización periódica
   */
  public start() {
    if (this.intervalId) {
      console.log('Servicio ya iniciado');
      return;
    }

    console.log('Iniciando servicio de sincronización de Gmail...');
    
    // Ejecutar inmediatamente
    this.syncEmails();
    
    // Configurar intervalo periódico
    this.intervalId = setInterval(() => {
      this.syncEmails();
    }, (this.config.intervalMinutes! * 60 * 1000));

    console.log(`Servicio configurado para ejecutarse cada ${this.config.intervalMinutes} minutos`);
  }

  /**
   * Detiene el servicio
   */
  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Servicio de sincronización detenido');
    }
  }

  /**
   * Ejecuta una sincronización manual
   */
  public async syncNow() {
    console.log('Ejecutando sincronización manual...');
    await this.syncEmails();
  }

  /**
   * Obtiene el estado actual del servicio
   */
  public getStatus() {
    return {
      running: this.isRunning,
      intervalMinutes: this.config.intervalMinutes,
      nextSync: this.intervalId ? 'Programado' : 'No programado'
    };
  }
}

// Instancia singleton
let gmailSyncService: GmailSyncService | null = null;

export function getGmailSyncService(): GmailSyncService {
  if (!gmailSyncService) {
    gmailSyncService = new GmailSyncService();
  }
  return gmailSyncService;
}