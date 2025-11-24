const { google } = require('googleapis');
const path = require('path');


require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3001/oauth-code'; 
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;


// 3. Inicializar el cliente OAuth2 y configurar el Refresh Token
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Establecer el Refresh Token para que el cliente pueda generar nuevos Access Tokens automáticamente
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// 4. Inicializar el servicio de Gmail
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Convierte un mensaje de texto plano a formato base64 url-safe para la API de Gmail.
 * @param {string} rawMessage El mensaje de correo electrónico en formato MIME (headers y body).
 * @returns {string} El mensaje codificado.
 */
function encodeMessage(rawMessage) {
    // Codifica a Base64
    const base64 = Buffer.from(rawMessage)
        .toString('base64');
    
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Crea el contenido del correo electrónico y lo envía.
 * @param {string} toEmail El destinatario.
 * @param {string} subject El asunto del correo.
 * @param {string} bodyText El cuerpo del mensaje en texto plano.
 */
async function sendEmail(toEmail, subject, bodyText) {
    try {
        const fromEmail = 'me'; // 'me' indica al usuario autenticado (el dueño del Refresh Token)
        
        // Formato MIME del correo (Requerido por la API de Gmail)
        const raw = [
            `To: ${toEmail}`,
            `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`, // Codificación de asunto
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            '',
            bodyText,
        ].join('\n');

        const encodedMessage = encodeMessage(raw);

        // Envía el mensaje
        const response = await gmail.users.messages.send({
            userId: fromEmail,
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log('\n======================================');
        console.log('✅ Correo enviado exitosamente!');
        console.log('ID del Mensaje:', response.data.id);
        console.log('Enviado a:', toEmail);
        console.log('======================================');

    } catch (error) {
        console.error('\n❌ ERROR al enviar el correo:');
        console.error(error.message);
        if (error.response && error.response.data && error.response.data.error) {
            console.error('Detalles del Error:', error.response.data.error);
        }
    }
}

// --- CONFIGURACIÓN DE ENVÍO ---
const DESTINATARIO = 'parcial795@gmail.com'; // <-- ¡Cambia esto al email de prueba!
const ASUNTO = 'Prueba de Envío con Refresh Token';
const CUERPO = 'Hola,\n\nEste es un correo de prueba enviado usando Node.js y el Refresh Token de la API de Gmail.';

sendEmail(DESTINATARIO, ASUNTO, CUERPO);