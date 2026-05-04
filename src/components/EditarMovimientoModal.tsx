'use client';

import { useState, useEffect } from 'react';
import { sesionService } from '@/services/sesionService';

interface Props {
  movimiento: any;
  sesionId: string;
  onSave: () => void;
  onClose: () => void;
}

export default function EditarMovimientoModal({ movimiento, sesionId, onSave, onClose }: Props) {
  const [detalle, setDetalle] = useState(movimiento.detalle || '');
  const [monto, setMonto] = useState(movimiento.monto.toString());
  const [categoria, setCategoria] = useState(movimiento.categoria);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sesionService.actualizarMovimiento(movimiento.id, sesionId, {
        detalle,
        monto: parseFloat(monto),
        categoria,
      });
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">✏️ Editar Movimiento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select 
              value={categoria} 
              onChange={e => setCategoria(e.target.value as 'proveedor' | 'gasto')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="gasto">Gasto</option>
              <option value="proveedor">Proveedor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Detalle</label>
            <input 
              type="text" 
              value={detalle} 
              onChange={e => setDetalle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
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