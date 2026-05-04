'use client';

import { useState } from 'react';
import { SesionDiaria } from '@/types/api';

interface Props {
  sesion: SesionDiaria;
  onSave: (efectivoFinal: number, baseSiguiente: number) => void;
  onClose: () => void;
}

export default function EditarSesionCerradaModal({ sesion, onSave, onClose }: Props) {
  const [efectivoFinal, setEfectivoFinal] = useState(sesion.efectivo_final?.toString() || '');
  const [baseSiguiente, setBaseSiguiente] = useState(sesion.base_siguiente?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(parseFloat(efectivoFinal), parseFloat(baseSiguiente));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">✏️ Modificar Sesión</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Sesión del: <span className="font-semibold">{sesion.fecha}</span>
            <br />
            Modificaciones restantes: <span className="font-semibold text-blue-600">{3 - (sesion.modificaciones || 0)}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Efectivo Final ($)</label>
            <input
              type="number"
              value={efectivoFinal}
              onChange={(e) => setEfectivoFinal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Siguiente ($)</label>
            <input
              type="number"
              value={baseSiguiente}
              onChange={(e) => setBaseSiguiente(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}