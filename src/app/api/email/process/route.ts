// src/app/api/email/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
// Importar los tipos de Enum de Prisma para tipado estricto
import { PrismaClient, EstadoCaso, EtapaAprobacion, Prioridad, TipoSolicitud } from '@prisma/client'; 

const prisma = new PrismaClient();

// Definimos el tipo de enum de la base de datos para tipado estricto
// **NOTA:** Este enum custom ahora debe ser tipado para los valores que usa la lógica
type TipoSolicitudDetectada = 'SOLICITUD_COTIZACION' | 'CONSULTA_GENERAL' | 'QUEJA_RECLAMO' | 'REPORTE_INFORME' | 'SOLICITUD_INFORMACION' | 'OTRO';
// Se renombra para evitar confusión con el enum de Prisma `TipoSolicitud`

// Tipos personalizados para evitar errores de string literal si no se usa el enum de Prisma
type PrioridadEnum = 'MUY_ALTA' | 'ALTA' | 'MEDIA' | 'BAJA';


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
    try {
      return Buffer.from(body, 'base64').toString('utf-8');
    } catch (e) {
      console.error('Error al decodificar base64:', e);
      return '';
    }
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
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += decodeEmailBody(part.body.data) + '\n';
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        const htmlContent = decodeEmailBody(part.body.data);
        // Limpiar HTML y extraer texto
        text += htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') + '\n';
      }
    }
  }

  return text;
}

// Función para extraer número de radicado (MEJORADA)
function extraerNumeroRadicado(asunto: string, cuerpo: string): string | null {
  const patrones = [
    /radicado[:\s]*([A-Za-z0-9-]+)/i,
    /radicado\s*#?\s*([A-Za-z0-9-]+)/i,
    /n°?[:\s]*([A-Za-z0-9-]+)/i,
    /numero[:\s]*([A-Za-z0-9-]+)/i,
    /([A-Z]{2,4}[-_][0-9]{4}[-_][0-9]+)/i, // Ej: SUI-2024-001
    /([0-9]{3}[-_][0-9]{5}[-_][A-Z0-9]+)/i, // Ej: 322-01527-E25
    /(radicado.*\n.*[A-Za-z0-9-]+)/i, // Buscar en líneas siguientes
    /(No\.?\s*[A-Za-z0-9-]+)/i, // Ej: No. 12345
    /(REF[:\s]*[A-Za-z0-9-]+)/i, // Ej: REF: 12345
    /(Caso[:\s]*[A-Za-z0-9-]+)/i // Ej: Caso: ABC-123
  ];

  const textoCompleto = (asunto + ' ' + cuerpo).toLowerCase();

  // Buscar en asunto primero
  for (const patron of patrones) {
    const match = asunto.match(patron);
    if (match) {
      // Tomar el primer grupo de captura o todo el match
      const radicado = match[1] || match[0];
      if (radicado && radicado.length > 3) { // Evitar matches muy cortos
        return radicado.toUpperCase().trim().replace(/^[^a-zA-Z0-9]*/, '').replace(/[^a-zA-Z0-9]*$/, '');
      }
    }
  }

  // Buscar en cuerpo si no se encuentra en asunto
  for (const patron of patrones) {
    const match = cuerpo.match(patron);
    if (match) {
      const radicado = match[1] || match[0];
      if (radicado && radicado.length > 3) {
        return radicado.toUpperCase().trim().replace(/^[^a-zA-Z0-9]*/, '').replace(/[^a-zA-Z0-9]*$/, '');
      }
    }
  }

  return null;
}

// Función para detectar entidad (MEJORADA para incluir todos los dominios)
function detectarEntidad(from: string, asunto: string, cuerpo: string): string {
  const dominiosEntidades = {
    'superservicios.gov.co': 'SUI',
    'minminas.gov.co': 'MME',
    'gov.co': 'ENTIDAD_GUBERNAMENTAL',
    'gob.co': 'ENTIDAD_GUBERNAMENTAL',
    'crcom.gov.co': 'CRC',
    'anla.gov.co': 'ANLA',
    'icbf.gov.co': 'ICBF',
    'mintrabajo.gov.co': 'MINTRABAJO',
    'minambiente.gov.co': 'MINAMBIENTE',
    // Puedes agregar más entidades gubernamentales aquí
  };

  // Detectar por dominio del remitente
  const dominio = from.split('@')[1]?.toLowerCase();
  if (dominio && dominiosEntidades[dominio as keyof typeof dominiosEntidades]) {
    return dominiosEntidades[dominio as keyof typeof dominiosEntidades];
  }

  // Detectar por palabras clave en asunto y cuerpo
  const palabrasClave = {
    'SUI': ['superintendencia', 'servicios públicos', 'sui', 'superservicios'],
    'MME': ['ministerio', 'minas', 'energía', 'mme', 'minminas'],
    'CRC': ['comisión de regulación', 'crc', 'comunicaciones'],
    'ANLA': ['autoridad ambiental', 'anla', 'licencia ambiental'],
    'ICBF': ['icbf', 'bienestar familiar', 'niños'],
    'MINTRABAJO': ['ministerio del trabajo', 'mintrabajo', 'laboral'],
    'MINAMBIENTE': ['ministerio ambiente', 'minambiente', 'ambiental'],
    'PROVEEDOR': ['cotización', 'propuesta', 'presupuesto', 'proveedor', 'oferta'],
    'CLIENTE': ['consulta', 'solicitud', 'cliente', 'usuario', 'queja'],
    'INTERNO': ['reporte interno', 'comunicación interna', 'gerencia', 'director']
  };

  const textoCompleto = (asunto + ' ' + cuerpo).toLowerCase();
  
  for (const [entidad, palabras] of Object.entries(palabrasClave)) {
    if (palabras.some(palabra => textoCompleto.includes(palabra.toLowerCase()))) {
      return entidad;
    }
  }

  // Si es de dominio gubernamental pero no está en la lista
  if (dominio && (dominio.includes('.gov.co') || dominio.includes('.gob.co'))) {
    return 'ENTIDAD_GUBERNAMENTAL';
  }

  // Si es Gmail u otro dominio comercial
  if (dominio && (dominio.includes('gmail.com') || dominio.includes('hotmail.com') || dominio.includes('yahoo.com'))) {
    return 'CORREO_EXTERNO';
  }

  return 'OTRA_ENTIDAD';
}

// Función para detectar prioridad (MEJORADA y tipada)
function detectarPrioridad(asunto: string, cuerpo: string, remitente: string): PrioridadEnum {
  const texto = (asunto + ' ' + cuerpo).toLowerCase();
  const dominio = remitente.split('@')[1] || '';
  
  // Correos de entidades gubernamentales tienen mayor prioridad por defecto
  if (dominio.includes('.gov.co') || dominio.includes('.gob.co')) {
    if (texto.includes('urgente') || texto.includes('inmediato') || texto.includes('prioridad máxima')) {
      return 'MUY_ALTA';
    }
    return 'ALTA'; // Prioridad alta por defecto para entidades gubernamentales
  }
  
  // Para otros dominios
  if (texto.includes('urgente') || texto.includes('inmediato') || texto.includes('prioridad máxima')) {
    return 'ALTA';
  } else if (texto.includes('importante') || texto.includes('prioridad alta') || texto.includes('atención')) {
    return 'ALTA';
  } else if (texto.includes('prioridad media') || texto.includes('consulta')) {
    return 'MEDIA';
  }
  
  return 'BAJA';
}

// Función para detectar tipo de solicitud (tipada)
function detectarTipoSolicitud(asunto: string, cuerpo: string): TipoSolicitudDetectada {
  const texto = (asunto + ' ' + cuerpo).toLowerCase();
  
  if (texto.includes('cotización') || texto.includes('presupuesto') || texto.includes('proveedor')) {
    return 'SOLICITUD_COTIZACION';
  } else if (texto.includes('consulta') || texto.includes('pregunta') || texto.includes('duda')) {
    return 'CONSULTA_GENERAL';
  } else if (texto.includes('queja') || texto.includes('reclamo') || texto.includes('insatisfecho')) {
    return 'QUEJA_RECLAMO';
  } else if (texto.includes('reporte') || texto.includes('informe') || texto.includes('resultado')) {
    return 'REPORTE_INFORME';
  } else if (texto.includes('requerimiento') || texto.includes('solicitud información') || texto.includes('oficio')) {
    return 'SOLICITUD_INFORMACION';
  }
  
  return 'OTRO';
}

// Función para procesar un email individual
async function procesarEmailIndividual(messageId: string) {
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

    const from = getHeader('from') || '';
    const subject = getHeader('subject') || '';
    const date = getHeader('date') || new Date().toISOString();

    // Extraer el cuerpo del email
    let bodyText = '';
    let bodyHtml = '';
    
    if (email.payload?.parts) {
      bodyText = extractEmailText(email.payload.parts);
      
      // Extraer HTML también
      for (const part of email.payload.parts) {
        if (part.parts) {
          for (const subPart of part.parts) {
            if (subPart.mimeType === 'text/html' && subPart.body?.data) {
              bodyHtml = decodeEmailBody(subPart.body.data);
            }
          }
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = decodeEmailBody(part.body.data);
        }
      }
    } else if (email.payload?.body?.data) {
      bodyText = decodeEmailBody(email.payload.body.data);
    }

    // Procesar información del email
    const numeroRadicado = extraerNumeroRadicado(subject, bodyText);
    const entidadDetectada = detectarEntidad(from, subject, bodyText);
    const prioridadDetectada = detectarPrioridad(subject, bodyText, from);
    // Usa el tipo detectado localmente
    const tipoSolicitudDetectada = detectarTipoSolicitud(subject, bodyText); 
    const dominioRemitente = from.split('@')[1] || '';
    
    // Determinar si es entidad de control (gubernamental)
    const esEntidadControl = dominioRemitente.includes('.gov.co') || 
                            dominioRemitente.includes('.gob.co') || 
                            entidadDetectada !== 'CORREO_EXTERNO' && 
                            entidadDetectada !== 'OTRA_ENTIDAD';

    // Extraer nombre del remitente
    const remitenteMatch = from.match(/(.*)<(.*)>/);
    const remitenteOriginal = remitenteMatch ? remitenteMatch[1].trim() : from;

    // Palabras clave para búsqueda
    const palabrasClave = [
      entidadDetectada, 
      prioridadDetectada, 
      tipoSolicitudDetectada, // Usa el tipo local
      ...subject.split(' ').slice(0, 5), // Primeras 5 palabras del asunto
      dominioRemitente
    ].filter(Boolean) as string[];

    // Verificar si el email ya existe
    const emailExistente = await prisma.email.findUnique({
      where: { messageId: messageId }
    });

    if (emailExistente) {
      console.log(`📧 Email ya procesado: ${subject}`);
      return {
        id: emailExistente.id,
        messageId,
        subject,
        from,
        entidad: emailExistente.entidadDetectada,
        prioridad: emailExistente.prioridadDetectada,
        radicado: emailExistente.numeroRadicado,
        fecha: emailExistente.fecha.toString()
      };
    }

    // Preparar adjuntos para la base de datos (manejo seguro y tipado para JSON field)
    const attachmentsData = email.payload?.parts?.filter(part => 
      part.filename && part.filename.length > 0
    ).map(part => ({
      filename: part.filename,
      mimeType: part.mimeType,
      // CORRECCIÓN 3: Acceso seguro a size
      size: part.body?.size || 0 
    })) || [];
    
    // Guardar en base de datos
    const emailGuardado = await prisma.email.create({
      data: {
        messageId: messageId,
        from: from,
        to: getHeader('to') || '',
        subject: subject,
        body: bodyText.substring(0, 10000), // Limitar tamaño
        html: bodyHtml ? bodyHtml.substring(0, 15000) : null,
        fecha: new Date(date),
        // CORRECCIÓN 2: Asignación segura del array de adjuntos (asumimos tipo Json o Json[])
        attachments: attachmentsData as any, 
        entidadDetectada: entidadDetectada,
        // El enum de Prisma `Prioridad` es compatible con PrioridadEnum
        prioridadDetectada: prioridadDetectada as Prioridad, 
        numeroRadicado: numeroRadicado,
        remitenteOriginal: remitenteOriginal,
        dominioRemitente: dominioRemitente,
        esEntidadControl: esEntidadControl,
        palabrasClave: palabrasClave,
        procesado: true,
        clasificado: !!numeroRadicado || esEntidadControl
      }
    });

    console.log(`✅ Email guardado: ${subject}`);

    // Crear caso automáticamente si cumple condiciones
    if ((numeroRadicado || esEntidadControl) && !emailExistente) {
      await crearCasoDesdeEmail(emailGuardado, tipoSolicitudDetectada);
    }

    return {
      id: emailGuardado.id,
      messageId,
      subject,
      from,
      entidad: entidadDetectada,
      prioridad: prioridadDetectada,
      radicado: numeroRadicado,
      fecha: date,
      tipoSolicitud: tipoSolicitudDetectada
    };

  } catch (error) {
    console.error('Error procesando email:', error);
    throw error;
  }
}

// Función para crear caso automáticamente desde email (MEJORADA)
async function crearCasoDesdeEmail(email: any, tipoSolicitudDetectada: TipoSolicitudDetectada) {
  try {
    // Buscar entidad en la base de datos
    let entidadExistente = await prisma.entidad.findFirst({
      where: {
        OR: [
          { sigla: email.entidadDetectada },
          { nombre: { contains: email.entidadDetectada, mode: 'insensitive' } }
        ]
      }
    });

    // Si no existe la entidad, crearla
    if (!entidadExistente && email.entidadDetectada !== 'CORREO_EXTERNO' && email.entidadDetectada !== 'OTRA_ENTIDAD') {
      entidadExistente = await prisma.entidad.create({
        data: {
          nombre: email.entidadDetectada,
          sigla: email.entidadDetectada,
          color: generarColorAleatorio(),
          tiempoRespuestaDias: email.esEntidadControl ? 15 : 30
        }
      });
    }

    // Buscar responsable por defecto
    let responsableId = null;
    if (entidadExistente?.responsablePorDefectoId) {
      responsableId = entidadExistente.responsablePorDefectoId;
    } else {
      // Asignar a un administrador por defecto
      const admin = await prisma.user.findFirst({
        where: { 
          OR: [
            { role: 'ADMINISTRADOR_ASIGNACIONES' },
            { role: 'ADMINISTRADOR_SISTEMA' }
          ],
          activo: true 
        }
      });
      if (admin) responsableId = admin.id;
    }

    // Si no hay responsable, usar el usuario por defecto
    if (!responsableId) {
      responsableId = await obtenerUsuarioPorDefecto();
    }

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date();
    const diasRespuesta = entidadExistente?.tiempoRespuestaDias || 
                         (email.esEntidadControl ? 15 : 30);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasRespuesta);

    // Determinar estado inicial - **CORRECCIÓN 1: Usar Enums de Prisma**
    let estado: EstadoCaso = EstadoCaso.PENDIENTE;
    let etapaAprobacion: EtapaAprobacion = EtapaAprobacion.RECIBIDO;

    // Si es de proveedor o cliente, puede ir directamente a asignado
    if (email.entidadDetectada === 'PROVEEDOR' || email.entidadDetectada === 'CLIENTE') {
      estado = EstadoCaso.ASIGNADO;
      etapaAprobacion = EtapaAprobacion.ASIGNADO;
    }

    // Crear el caso
    const caso = await prisma.caso.create({
      data: {
        asunto: email.subject.length > 200 ? email.subject.substring(0, 200) + '...' : email.subject,
        descripcion: `Correo recibido de ${email.remitenteOriginal} (${email.from}).\n\n${email.body.substring(0, 1000)}...`,
        // email.prioridadDetectada ya es compatible con Prioridad
        prioridad: email.prioridadDetectada || Prioridad.MEDIA, 
        // CORRECCIÓN: Asignación de enum de Prisma
        estado: estado, 
        // CORRECCIÓN: Asignación de enum de Prisma
        etapaAprobacion: etapaAprobacion, 
        // CORRECCIÓN: Casteo para forzar compatibilidad entre TipoSolicitudDetectada y TipoSolicitud de Prisma
        tipoSolicitud: tipoSolicitudDetectada as any as TipoSolicitud, 
        numeroRadicadoEntrada: email.numeroRadicado,
        entidadId: entidadExistente?.id || await obtenerEntidadPorDefecto(),
        responsableId: responsableId,
        creadorId: responsableId,
        fechaRecepcion: email.fecha,
        fechaVencimiento: fechaVencimiento,
        emailId: email.id
      },
      include: {
        entidad: true,
        responsable: true
      }
    });

    // Crear actividad
    await prisma.actividad.create({
      data: {
        tipo: 'CREACION',
        descripcion: `Caso creado automáticamente desde correo de ${email.remitenteOriginal}`,
        casoId: caso.id,
        usuarioId: responsableId
      }
    });

    console.log(`✅ Caso creado automáticamente: ${caso.id} - ${email.subject}`);
    return caso;

  } catch (error) {
    console.error('Error creando caso desde email:', error);
    // No relanzar el error para no interrumpir el procesamiento de otros emails
  }
}

// Función auxiliar para generar color aleatorio
function generarColorAleatorio(): string {
  const colores = ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#06B6D4'];
  return colores[Math.floor(Math.random() * colores.length)];
}

// Funciones auxiliares
async function obtenerEntidadPorDefecto(): Promise<string> {
  const entidad = await prisma.entidad.findFirst({
    where: { sigla: 'OTRAS' }
  });
  if (entidad) return entidad.id;

  // Crear entidad por defecto si no existe
  const nuevaEntidad = await prisma.entidad.create({
    data: {
      nombre: 'Otras Entidades',
      sigla: 'OTRAS',
      color: '#6B7280',
      tiempoRespuestaDias: 30
    }
  });
  return nuevaEntidad.id;
}

async function obtenerUsuarioPorDefecto(): Promise<string> {
  const usuario = await prisma.user.findFirst({
    where: { 
      OR: [
        { role: 'ADMINISTRADOR_SISTEMA' },
        { role: 'ADMINISTRADOR_ASIGNACIONES' },
        { role: 'GESTOR' }
      ],
      activo: true 
    }
  });
  if (usuario) return usuario.id;

  // Si no hay usuarios, crear uno por defecto (solo para desarrollo)
  const defaultUser = await prisma.user.findFirst();
  return defaultUser?.id || 'default-user-id';
}

// Función para buscar nuevos emails (ACTUALIZADA para todos los dominios)
async function buscarNuevosEmails() {
  try {
    // Buscar TODOS los emails no leídos (sin filtrar por dominio)
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread', // Solo emails no leídos
      maxResults: 50 // Aumentar límite para procesar más emails
    });

    const messages = response.data.messages || [];
    const processedEmails = [];

    console.log(`📨 Encontrados ${messages.length} emails nuevos de TODOS los dominios`);

    for (const message of messages) {
      if (message.id) {
        try {
          const emailData = await procesarEmailIndividual(message.id);
          processedEmails.push(emailData);

          // Marcar como leído después de procesar exitosamente
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              removeLabelIds: ['UNREAD']
            }
          });

          console.log(`✅ Procesado: ${emailData.subject}`);

          // Pequeña pausa para no saturar la API de Gmail
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`❌ Error procesando email ${message.id}:`, error);
        }
      }
    }

    return processedEmails;

  } catch (error) {
    console.error('Error buscando nuevos emails:', error);
    throw error;
  }
}

// Endpoint principal
export async function POST(request: NextRequest) {
  try {
    const { action = 'check' } = await request.json();

    if (action === 'check') {
      const processedEmails = await buscarNuevosEmails();
      
      return NextResponse.json({
        success: true,
        message: `Procesados ${processedEmails.length} nuevos emails de todos los dominios`,
        emails: processedEmails
      });
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en API de procesamiento de email:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al procesar emails' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Endpoint para obtener estadísticas
export async function GET(request: NextRequest) {
  try {
    const totalEmails = await prisma.email.count();
    const emailsProcesados = await prisma.email.count({ where: { procesado: true } });
    const emailsConCaso = await prisma.email.count({ where: { caso: { isNot: null } } });
    
    // Estadísticas por tipo de entidad
    const statsPorEntidad = await prisma.email.groupBy({
      by: ['entidadDetectada'],
      where: { procesado: true },
      _count: { id: true }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalEmails,
        emailsProcesados,
        emailsConCaso,
        emailsPendientes: totalEmails - emailsProcesados,
        porEntidad: statsPorEntidad
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}