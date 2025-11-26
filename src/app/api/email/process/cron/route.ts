// src/app/api/email/process/cron/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Verificar secret key para seguridad
        const authHeader = request.headers.get('authorization');
        
        // Corregir la interpolación de string
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Llamar al endpoint de procesamiento internamente
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/email/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'check' }),
        });

        if (!response.ok) {
            throw new Error(`Error en procesamiento: ${response.statusText}`);
        }

        const result = await response.json();

        return NextResponse.json({
            message: 'Procesamiento automático ejecutado exitosamente',
            ...result
        });

    } catch (error) {
        console.error('Error en cron job:', error);
        return NextResponse.json(
            { error: 'Error en procesamiento automático' },
            { status: 500 }
        );
    }
}