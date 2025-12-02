import { getGmailSyncService } from '@/services/gmail-sync-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeGmailSync() {
  console.log('🚀 Inicializando servicio de sincronización de Gmail...');

  try {
    // Verificar configuración
    if (!process.env.GOOGLE_CREDENTIALS_JSON && !process.env.GOOGLE_CREDENTIALS_PATH) {
      console.error('❌ ERROR: No se encontraron credenciales de Google');
      console.log('Por favor configura una de estas variables de entorno:');
      console.log('- GOOGLE_CREDENTIALS_JSON: JSON completo de credenciales');
      console.log('- GOOGLE_CREDENTIALS_PATH: Ruta al archivo de credenciales');
      process.exit(1);
    }

    if (!process.env.GMAIL_REFRESH_TOKEN) {
      console.error('❌ ERROR: No se encontró GMAIL_REFRESH_TOKEN');
      console.log('Ejecuta el script de autenticación primero:');
      console.log('npm run gmail-auth');
      process.exit(1);
    }

    // Iniciar servicio
    const gmailSyncService = getGmailSyncService();
    gmailSyncService.start();

    // Manejar señales de terminación
    process.on('SIGINT', () => {
      console.log('\n🛑 Recibida señal SIGINT, deteniendo servicio...');
      gmailSyncService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Recibida señal SIGTERM, deteniendo servicio...');
      gmailSyncService.stop();
      process.exit(0);
    });

    console.log('✅ Servicio de sincronización de Gmail iniciado correctamente');
    console.log('📧 Los emails se sincronizarán automáticamente');
    
  } catch (error) {
    console.error('❌ Error inicializando servicio:', error);
    process.exit(1);
  }
}

// Ejecutar si es el script principal
if (require.main === module) {
  initializeGmailSync();
}

export { initializeGmailSync };