const { google } = require('googleapis');

// Reemplaza con tus credenciales de Google Cloud Console
const CLIENT_ID = '472759661598-evb8v5akgsg380icdaj1b1tue50j2kds.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback/google';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Genera la URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
  ],
  prompt: 'consent' // Esto es importante para obtener el refresh token
});

console.log('Autoriza esta app visitando esta URL:');
console.log(authUrl);
console.log('\nDespués de autorizar, copia el código de la URL y ejecuta:');
console.log('node scripts/get-gmail-tokens.js TU_CODIGO_AQUI');

// Si se proporciona un código como argumento
if (process.argv[2]) {
  const CODE = process.argv[2];
  
  async function getTokens() {
    try {
      const { tokens } = await oauth2Client.getToken(CODE);
      console.log('\n✅ Tokens obtenidos exitosamente!');
      console.log('Access Token:', tokens.access_token);
      console.log('Refresh Token:', tokens.refresh_token);
      console.log('Scope:', tokens.scope);
      console.log('Token Type:', tokens.token_type);
      
      // Guarda estos tokens en tu .env.local
      console.log('\n📝 Agrega esto a tu .env.local:');
      console.log(`GMAIL_CLIENT_ID="${CLIENT_ID}"`);
      console.log(`GMAIL_CLIENT_SECRET="${CLIENT_SECRET}"`);
      console.log(`GMAIL_REFRESH_TOKEN="${tokens.refresh_token}"`);
      
    } catch (error) {
      console.error('❌ Error obteniendo tokens:', error.message);
    }
  }

  getTokens();
}