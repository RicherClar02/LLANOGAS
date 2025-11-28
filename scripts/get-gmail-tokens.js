// scripts/get-gmail-tokens.js
const { google } = require('googleapis');
const path = require('path');


require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });


const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
// Usamos GMAIL_REDIRECT_URI para la URL completa, o un fallback
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3001/api/auth/callback/google'; 

// Verifica que las claves se hayan cargado (opcional, pero útil)
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ ERROR: GMAIL_CLIENT_ID o GMAIL_CLIENT_SECRET no están definidos. Verifica tu archivo .env.local y la instalación de dotenv.");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// --- Generación de la URL de Autorización ---
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
    ],
    prompt: 'consent' // Importante para obtener el Refresh Token
});

console.log('Autoriza esta app visitando esta URL:');
console.log(authUrl);
console.log('\nDespués de autorizar, copia el código de la URL y ejecuta:');
console.log('node get-gmail-tokens.js TU_CODIGO_AQUI');

// --- Procesamiento del Código de Autorización ---
if (process.argv[2]) {
    const CODE = process.argv[2];
    
    async function getTokens() {
        try {
            const { tokens } = await oauth2Client.getToken(CODE);
            console.log('\n✅ Tokens obtenidos exitosamente!');
            console.log('Access Token:', tokens.access_token);
            console.log('Refresh Token:', tokens.refresh_token);
            
            // Guarda estos tokens en tu .env.local
            console.log('\n📝 Agrega ESTO a tu .env.local:');
            // Nota: No necesitas el CLIENT_ID y SECRET si ya están allí, solo el REFRESH_TOKEN
            console.log(`GMAIL_REFRESH_TOKEN="${tokens.refresh_token}"`);
            
        } catch (error) {
            console.error('❌ Error obteniendo tokens:');
            console.error(error.message);
        }
    }

    getTokens();
}