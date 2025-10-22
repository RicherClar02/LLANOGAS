// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ejecutando seed...');
  
  try {
    // Crear un usuario simple
    const user = await prisma.user.create({
      data: {
        email: 'admin@llanogas.com',
        name: 'Administrador',
        password: 'password123',
        role: 'ADMIN',
      },
    });
    console.log('✅ Usuario creado');

    // Crear una entidad simple
    const entidad = await prisma.entidad.create({
      data: {
        nombre: 'SUI',
        sigla: 'SUI',
        color: '#3B82F6',
        email: 'sui@gov.co',
      },
    });
    console.log('✅ Entidad creada');

    // Crear un caso simple
    const caso = await prisma.caso.create({
      data: {
        asunto: 'Primer caso de prueba',
        descripcion: 'Este es el primer caso en el sistema',
        prioridad: 'ALTA',
        estado: 'PENDIENTE',
        entidadId: entidad.id,
        responsableId: user.id,
      },
    });
    console.log('✅ Caso creado');

    console.log('🎉 Seed completado!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .finally(() => prisma.$disconnect());