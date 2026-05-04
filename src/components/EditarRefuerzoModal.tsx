'use client';

import { useState } from 'react';
import { sesionService } from '@/services/sesionService';

interface Props {
  refuerzo: any;
  sesionId: string;
  onSave: () => void;
  onClose: () => void;
}

export default function EditarRefuerzoModal({ refuerzo, sesionId, onSave, onClose }: Props) {
  const [monto, setMonto] = useState(refuerzo.monto.toString());
  const [observacion, setObservacion] = useState(refuerzo.observacion || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sesionService.actualizarRefuerzo(refuerzo.id, sesionId, parseFloat(monto), observacion || undefined);
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Editar Refuerzo</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
            <input 
              type="number" 
              value={monto} 
              onChange={e => setMonto(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              step="0.01" 
              min="0" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observación</label>
            <input 
              type="text" 
              value={observacion} 
              onChange={e => setObservacion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded p-3">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}