// prisma/seed.ts
// Script para poblar la base de datos con datos de prueba
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@llanogas.com' },
    update: {},
    create: {
      email: 'admin@llanogas.com',
      name: 'Administrador Sistema',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'ana.garcia@llanogas.com' },
    update: {},
    create: {
      email: 'ana.garcia@llanogas.com',
      name: 'Ana García',
      password: hashedPassword,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'carlos.rodriguez@llanogas.com' },
    update: {},
    create: {
      email: 'carlos.rodriguez@llanogas.com',
      name: 'Carlos Rodríguez',
      password: hashedPassword,
      role: 'USER',
    },
  });

  // Crear entidades
  const entidades = await Promise.all([
    prisma.entidad.upsert({
      where: { sigla: 'SUI' },
      update: {},
      create: {
        nombre: 'Superintendencia de Servicios Públicos',
        sigla: 'SUI',
        color: '#3B82F6',
        email: 'sui@superservicios.gov.co',
        descripcion: 'Entidad encargada de la supervisión de servicios públicos'
      },
    }),
    prisma.entidad.upsert({
      where: { sigla: 'SS' },
      update: {},
      create: {
        nombre: 'Superservicios',
        sigla: 'SS',
        color: '#10B981',
        email: 'contacto@superservicios.gov.co',
        descripcion: 'Superintendencia de Servicios Públicos Domiciliarios'
      },
    }),
    prisma.entidad.upsert({
      where: { sigla: 'MME' },
      update: {},
      create: {
        nombre: 'Ministerio de Minas y Energía',
        sigla: 'MME',
        color: '#8B5CF6',
        email: 'minminas@minminas.gov.co',
        descripcion: 'Ministerio encargado del sector minero energético'
      },
    }),
  ]);

  console.log('✅ Seed completado!');
  console.log('👤 Usuarios creados:', admin.email, user1.email, user2.email);
  console.log('🏢 Entidades creadas:', entidades.length);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });