'use client';

import { useState, useEffect } from 'react';
import { sesionService } from '@/services/sesionService';

interface InicioDiaFormProps {
  onSesionCreada: (sesion: any) => void;
}

export default function InicioDiaForm({ onSesionCreada }: InicioDiaFormProps) {
  const [baseInicial, setBaseInicial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [baseSiguientePrevio, setBaseSiguientePrevio] = useState<number | null>(null);

  useEffect(() => {
    // Cargar la última sesión cerrada para obtener base_siguiente
    const cargarBasePrevio = async () => {
      try {
        const ultimaSesion = await sesionService.obtenerUltimaCerrada();
        if (ultimaSesion && ultimaSesion.base_siguiente) {
          setBaseSiguientePrevio(ultimaSesion.base_siguiente);
          setBaseInicial(ultimaSesion.base_siguiente.toString());
        }
      } catch (err) {
        // Si no hay sesión cerrada anterior, el campo permanece vacío
        // No mostrar error en la UI
      }
    };
    cargarBasePrevio();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const sesion = await sesionService.crear({ base_inicial: parseFloat(baseInicial) });
      onSesionCreada(sesion);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar el día');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Estás listo para empezar el día?</h2>
      <p className="text-gray-600 mb-6">Ingresa el efectivo base con el que iniciarás la jornada</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Base Inicial ($)</label>
          <input
            type="number"
            value={baseInicial}
            onChange={(e) => setBaseInicial(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 100"
            min="0"
            step="0.01"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Iniciando...' : 'Iniciar Día'}
        </button>
      </form>
    </div>
  );
}