import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

async function authenticateGmail() {
  console.log('🔐 Iniciando autenticación con Gmail API...');

  try {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

    if (!clientId || !clientSecret) {
      console.error('❌ ERROR: Faltan variables de entorno');
      console.log('Por favor configura estas variables en tu .env:');
      console.log('- GMAIL_CLIENT_ID');
      console.log('- GMAIL_CLIENT_SECRET');
      console.log('- GMAIL_REDIRECT_URI (opcional)');
      process.exit(1);
    }

    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Generar URL de autorización
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    console.log('\n📋 Autoriza esta aplicación visitando esta URL:');
    console.log(authUrl);
    console.log('\n');

    // Leer código de autorización
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Introduce el código de autorización de la URL: ', async (code) => {
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        
        console.log('\n✅ Autenticación exitosa!');
        console.log('\n📋 Agrega estas variables a tu archivo .env:');
        console.log('===========================================');
        console.log(`GMAIL_ACCESS_TOKEN="${tokens.access_token}"`);
        console.log(`GMAIL_REFRESH_TOKEN="${tokens.refresh_token}"`);
        
        if (tokens.id_token) {
          console.log(`GMAIL_ID_TOKEN="${tokens.id_token}"`);
        }
        
        console.log('===========================================');
        console.log('\n💡 También puedes configurar estas variables en tu servidor de producción');
        
        // Probar el token obtenido
        try {
          oAuth2Client.setCredentials(tokens);
          const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
          const profile = await gmail.users.getProfile({ userId: 'me' });
          console.log(`\n👤 Conectado como: ${profile.data.emailAddress}`);
        } catch (profileError) {
          console.warn('⚠️  No se pudo verificar el perfil, pero el token fue obtenido');
        }
        
        rl.close();
        process.exit(0);
      } catch (error: any) {
        console.error('❌ Error obteniendo token:', error.message);
        if (error.response?.data) {
          console.error('Detalles:', error.response.data);
        }
        rl.close();
        process.exit(1);
      }
    });

  } catch (error: any) {
    console.error('❌ Error en autenticación:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  // Cargar variables de entorno
  require('dotenv').config();
  authenticateGmail();
}

export { authenticateGmail };