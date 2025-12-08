// migracion.js
const { PrismaClient: PrismaLocal } = require('@prisma/client');
const { PrismaClient: PrismaCloud } = require('@prisma/client');

const localPrisma = new PrismaLocal({
  datasources: { db: { url: 'postgresql://postgres:Richer02@localhost:5432/llanogas' } }
});

const cloudPrisma = new PrismaCloud({
  datasources: { db: { url: 'postgresql://postgres:keToEoQtvpjGOLSZnGnYBcVQCXlJwUyR@ballast.proxy.rlwy.net:40314/railway' } }
});

async function migrarDatos() {
  console.log('Iniciando migración...');
  
  // Migrar usuarios
  const usuarios = await localPrisma.user.findMany();
  for (const usuario of usuarios) {
    await cloudPrisma.user.create({ data: usuario });
  }
  console.log(`✓ Usuarios migrados: ${usuarios.length}`);
  
  // Migrar entidades
  const entidades = await localPrisma.entidad.findMany();
  for (const entidad of entidades) {
    await cloudPrisma.entidad.create({ data: entidad });
  }
  console.log(`✓ Entidades migradas: ${entidades.length}`);
  
  // Continuar con otras tablas...
  // Casos, emails, actividades, etc.
  
  console.log('✅ Migración completada!');
  await localPrisma.$disconnect();
  await cloudPrisma.$disconnect();
}

migrarDatos().catch(console.error);