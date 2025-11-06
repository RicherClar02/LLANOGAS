// prisma/seed.ts - VERSIÓN CORREGIDA Y SIMPLIFICADA
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed con nuevos roles...');
  
  try {
    console.log('🗑️ Limpiando datos anteriores...');
    
    // Limpiar en orden correcto para evitar errores de FK
    await prisma.actividad.deleteMany();
    await prisma.documento.deleteMany();
    
    // Intentar limpiar los nuevos modelos solo si existen
    try {
      await prisma.revision.deleteMany();
    } catch (e) {
      console.log('⚠️  Tabla revisiones no existe aún, continuando...');
    }
    
    try {
      await prisma.aprobacion.deleteMany();
    } catch (e) {
      console.log('⚠️  Tabla aprobaciones no existe aún, continuando...');
    }
    
    await prisma.caso.deleteMany();
    await prisma.email.deleteMany();
    await prisma.entidad.deleteMany();
    await prisma.user.deleteMany();

    console.log('👤 Creando usuarios con nuevos roles...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Crear usuarios con los nuevos roles
    const usuarios = await Promise.all([
      // Administrador del Sistema
      prisma.user.create({
        data: {
          email: 'admin@llanogas.com',
          name: 'Administrador Sistema',
          password: hashedPassword,
          role: 'ADMINISTRADOR_SISTEMA',
          cargo: 'Administrador de Sistemas',
          proceso: 'TI',
          idColaborador: 'ADM001',
        },
      }),
      // Administrador de Asignaciones
      prisma.user.create({
        data: {
          email: 'asignaciones@llanogas.com',
          name: 'Coordinador Asignaciones',
          password: hashedPassword,
          role: 'ADMINISTRADOR_ASIGNACIONES',
          cargo: 'Coordinador de Correspondencia',
          proceso: 'Gestión Documental',
          idColaborador: 'ASG001',
        },
      }),
      // Gestores
      prisma.user.create({
        data: {
          email: 'ana.garcia@llanogas.com',
          name: 'Ana García',
          password: hashedPassword,
          role: 'GESTOR',
          cargo: 'Analista Jurídico',
          proceso: 'Jurídica',
          idColaborador: 'GES001',
        },
      }),
      prisma.user.create({
        data: {
          email: 'carlos.rodriguez@llanogas.com',
          name: 'Carlos Rodríguez',
          password: hashedPassword,
          role: 'GESTOR',
          cargo: 'Especialista Técnico',
          proceso: 'Operaciones',
          idColaborador: 'GES002',
        },
      }),
      // Revisor Jurídico
      prisma.user.create({
        data: {
          email: 'revisor.juridico@llanogas.com',
          name: 'María López - Revisora',
          password: hashedPassword,
          role: 'REVISOR_JURIDICO',
          cargo: 'Abogada Senior',
          proceso: 'Jurídica',
          idColaborador: 'REV001',
        },
      }),
      // Aprobador
      prisma.user.create({
        data: {
          email: 'aprobador@llanogas.com',
          name: 'Juan Pérez - Aprobador',
          password: hashedPassword,
          role: 'APROBADOR',
          cargo: 'Gerente de Área',
          proceso: 'Gerencia',
          idColaborador: 'APR001',
        },
      }),
    ]);

    console.log('🏢 Creando entidades...');
    const entidades = await Promise.all([
      prisma.entidad.create({
        data: {
          nombre: 'Superintendencia de Servicios Públicos',
          sigla: 'SUI',
          color: '#3B82F6',
          email: 'sui@superservicios.gov.co',
          descripcion: 'Entidad encargada de la supervisión de servicios públicos',
          dominiosCorreo: ['gov.co', 'superservicios.gov.co'],
          palabrasClave: ['SUI', 'superintendencia', 'servicios públicos'],
          tiempoRespuestaDias: 10,
          responsablePorDefectoId: usuarios[2].id, // Ana García
        },
      }),
      prisma.entidad.create({
        data: {
          nombre: 'Superservicios',
          sigla: 'SS',
          color: '#10B981',
          email: 'contacto@superservicios.gov.co',
          descripcion: 'Superintendencia de Servicios Públicos Domiciliarios',
          dominiosCorreo: ['gov.co', 'superservicios.gov.co'],
          palabrasClave: ['superservicios', 'servicios domiciliarios'],
          tiempoRespuestaDias: 15,
          responsablePorDefectoId: usuarios[3].id, // Carlos Rodríguez
        },
      }),
      prisma.entidad.create({
        data: {
          nombre: 'Ministerio de Minas y Energía',
          sigla: 'MME',
          color: '#8B5CF6',
          email: 'minminas@minminas.gov.co',
          descripcion: 'Ministerio encargado del sector minero energético',
          dominiosCorreo: ['gov.co', 'minminas.gov.co'],
          palabrasClave: ['ministerio', 'minas', 'energía'],
          tiempoRespuestaDias: 20,
        },
      }),
    ]);

    console.log('📋 Creando casos de ejemplo...');
    const casos = await Promise.all([
      prisma.caso.create({
        data: {
          asunto: 'Reporte mensual de indicadores de calidad',
          descripcion: 'Presentación del reporte mensual de indicadores de calidad del servicio de gas',
          prioridad: 'ALTA',
          estado: 'EN_REDACCION',
          etapaAprobacion: 'EN_REDACCION',
          tipoSolicitud: 'REPORTE_OBLIGATORIO',
          numeroRadicadoEntrada: '322-01527-E25',
          entidadId: entidades[0].id,
          responsableId: usuarios[2].id, // Ana García
          creadorId: usuarios[1].id, // Administrador de Asignaciones
          fechaRecepcion: new Date('2024-01-15'),
          fechaVencimiento: new Date('2024-01-25'),
        },
      }),
      prisma.caso.create({
        data: {
          asunto: 'Consulta sobre nueva regulación tarifaria',
          descripcion: 'Solicitud de aclaración sobre el nuevo marco tarifario',
          prioridad: 'MEDIA',
          estado: 'PENDIENTE',
          etapaAprobacion: 'RECIBIDO',
          tipoSolicitud: 'CONSULTA_JURIDICA',
          numeroRadicadoEntrada: '322-01521-E25',
          entidadId: entidades[1].id,
          responsableId: usuarios[3].id, // Carlos Rodríguez
          creadorId: usuarios[1].id,
          fechaRecepcion: new Date('2024-01-10'),
          fechaVencimiento: new Date('2024-01-25'),
        },
      }),
    ]);

    console.log('🎉 Seed completado exitosamente!');
    console.log('📊 Resumen de datos creados:');
    console.log(`   👤 Usuarios: ${usuarios.length}`);
    console.log(`   🏢 Entidades: ${entidades.length}`);
    console.log(`   📋 Casos: ${casos.length}`);
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    if (error instanceof Error) {
      console.error('Detalles:', error.message);
    }
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error final:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });