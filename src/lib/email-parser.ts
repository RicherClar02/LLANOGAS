// src/lib/email-parser.ts
export interface ParsedEmail {
  entidad?: string;
  asunto?: string;
  responsable?: string;
  vencimiento?: string;
  prioridad?: 'Alta' | 'Media' | 'Baja';
  categoria?: string;
}

export async function parseEmailContent(email: {
  from: string;
  subject: string;
  body: string;
  date: string;
}): Promise<ParsedEmail> {
  const { from, subject, body } = email;
  const parsed: ParsedEmail = {};

  // Extraer entidad del dominio del email
  const domainMatch = from.match(/@([^.]+)/);
  if (domainMatch) {
    parsed.entidad = domainMatch[1].toUpperCase();
  }

  // Usar el asunto del email
  parsed.asunto = subject;

  // Buscar patrones en el cuerpo del email
  const bodyLines = body.split('\n');
  
  for (const line of bodyLines) {
    const lowerLine = line.toLowerCase();
    
    // Detectar responsable
    if (lowerLine.includes('responsable:') || lowerLine.includes('contacto:')) {
      const match = line.match(/:\\s*(.+)/);
      if (match) parsed.responsable = match[1].trim();
    }
    
    // Detectar vencimiento
    if (lowerLine.includes('vencimiento:') || lowerLine.includes('fecha límite:')) {
      const match = line.match(/:\\s*(.+)/);
      if (match) parsed.vencimiento = match[1].trim();
    }
    
    // Detectar prioridad
    if (lowerLine.includes('urgente') || lowerLine.includes('alta prioridad')) {
      parsed.prioridad = 'Alta';
    } else if (lowerLine.includes('media prioridad')) {
      parsed.prioridad = 'Media';
    } else if (lowerLine.includes('baja prioridad')) {
      parsed.prioridad = 'Baja';
    }
  }

  return parsed;
}