'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SolicitarRevisionButtonProps {
  casoId: string;
  puedeSolicitar: boolean;
}

export default function SolicitarRevisionButton({ casoId, puedeSolicitar }: SolicitarRevisionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSolicitarRevision = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Llamar a tu API de Next.js
      const response = await fetch(`/api/casos/${casoId}/solicitar-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al solicitar la revisión.');
      }

      // 2. Éxito: Notificación y recarga
      alert('✅ Solicitud de revisión enviada con éxito.');
      router.refresh();
      
    } catch (err: any) {
      console.error('Error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSolicitarRevision}
        disabled={isLoading || !puedeSolicitar}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          puedeSolicitar 
            ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Enviando...' : 'Solicitar Revisión Legal'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          Error: {error}
        </p>
      )}
    </div>
  );
}