import bcrypt from 'bcryptjs';

const passwordToHash = '1234';
const saltRounds = 10; // Nivel de seguridad estándar

async function generateHash() {
    console.log(`Cifrando la contraseña: ${passwordToHash}`);
    try {
        const hash = await bcrypt.hash(passwordToHash, saltRounds);
        console.log(`\n==========================================`);
        console.log(`COPIA ESTE HASH (incluye $2a$):`);
        console.log(`HASH CIFRADO: ${hash}`);
        console.log(`==========================================\n`);
    } catch (error) {
        console.error('Error al generar el hash:', error);
    }
}

generateHash();