'use client';

import { useState } from 'react';
import { sesionService } from '@/services/sesionService';

interface MovimientoFormProps {
  sesionId: string;
  onMovimientoAgregado: () => void;
  tipo: 'refuerzo' | 'movimiento';
}

export default function MovimientoForm({ sesionId, onMovimientoAgregado, tipo }: MovimientoFormProps) {
  const [detalle, setDetalle] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<'proveedor' | 'gasto'>('gasto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (tipo === 'refuerzo') {
        await sesionService.crearRefuerzo({
          sesion_id: sesionId,
          monto: parseFloat(monto),
          observacion: detalle || undefined,
        });
      } else {
        await sesionService.crearMovimiento({
          sesion_id: sesionId,
          detalle,
          monto: parseFloat(monto),
          categoria,
        });
      }
      setDetalle('');
      setMonto('');
      onMovimientoAgregado();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al agregar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {tipo === 'movimiento' && (
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as 'proveedor' | 'gasto')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="gasto">Gasto</option>
          <option value="proveedor">Proveedor</option>
        </select>
      )}

      {tipo === 'movimiento' && (
        <input
          type="text"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder={categoria === 'proveedor' ? 'Ej: Queso, Pollo' : 'Ej: Transporte, Servicios'}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      )}

      {tipo === 'refuerzo' && (
        <input
          type="text"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Observación (opcional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      )}

      <input
        type="number"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        min="0"
        step="0.01"
        required
      />

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition text-sm"
      >
        {loading ? 'Agregando...' : tipo === 'refuerzo' ? 'Agregar Refuerzo' : 'Agregar'}
      </button>
    </form>
  );
}