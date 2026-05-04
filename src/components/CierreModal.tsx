'use client';

import { useState, useEffect } from 'react';
import { sesionService } from '@/services/sesionService';
import { SesionDiaria } from '@/types/api';

interface CierreModalProps {
  sesion: SesionDiaria;
  movimientos: any[];
  refuerzos: any[];
  onCierre: (resultado: SesionDiaria) => void;
  onClose: () => void;
}

export default function CierreModal({ sesion, movimientos, refuerzos, onCierre, onClose }: CierreModalProps) {
  const [efectivo, setEfectivo] = useState('');
  const [baseSiguiente, setBaseSiguiente] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  // Calcular totales en tiempo real
  const totalProveedor = movimientos.filter(m => m.categoria === 'proveedor').reduce((sum, m) => sum + m.monto, 0);
  const totalGastos = movimientos.filter(m => m.categoria === 'gasto').reduce((sum, m) => sum + m.monto, 0);
  const totalRefuerzos = refuerzos.reduce((sum, r) => sum + r.monto, 0);
  
  const efectivoNum = parseFloat(efectivo) || 0;
  const baseSigNum = parseFloat(baseSiguiente) || 0;

  const totalDisponible = sesion.base_inicial + totalRefuerzos;
  const totalEgresos = totalProveedor + totalGastos;
  const totalDia = (sesion.base_inicial + totalRefuerzos + efectivoNum) - totalProveedor - totalGastos;
  const ventas = (totalProveedor + totalGastos + efectivoNum) - (sesion.base_inicial + totalRefuerzos);

  const handleCerrar = async () => {
    // Primera vez: mostrar confirmación
    if (!confirmado) {
      setConfirmado(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resultado = await sesionService.cerrar(sesion.id, {
        efectivo_final: efectivoNum,
        base_siguiente: baseSigNum,
      });
      onCierre(resultado);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cerrar');
      setConfirmado(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-center mb-6 text-gray-900">🔐 Cierre de Caja</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Base Inicial:</span>
            <span className="font-medium text-gray-900">${sesion.base_inicial.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Refuerzos:</span>
            <span className="font-medium text-emerald-600">+${totalRefuerzos.toFixed(2)}</span>
          </div>
          <div className="border-t border-blue-200 my-2"></div>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-gray-900">Total Disponible:</span>
            <span className="text-blue-900">${totalDisponible.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Compras a Proveedores:</span>
            <span className="font-medium text-red-600">-${totalProveedor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Otros Gastos:</span>
            <span className="font-medium text-red-600">-${totalGastos.toFixed(2)}</span>
          </div>
          <div className="border-t border-amber-200 my-2"></div>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-gray-900">Total Egresos:</span>
            <span className="text-amber-900">${totalEgresos.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Efectivo en Caja ($)</label>
          <input
            type="number"
            value={efectivo}
            onChange={(e) => setEfectivo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Ej: 200"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-900 font-semibold">TOTAL DEL DÍA:</span>
            <span className="text-lg font-bold text-green-700">${totalDia.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900 font-semibold">VENTAS (implícitas):</span>
            <span className="text-lg font-bold text-emerald-600">${ventas.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Base para mañana ($)</label>
          <input
            type="number"
            value={baseSiguiente}
            onChange={(e) => setBaseSiguiente(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            min="0"
            step="0.01"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded p-3 mb-4">
            {error}
          </p>
        )}

        {confirmado && (
          <div className="bg-amber-100 border border-amber-400 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-amber-800 text-center">
              ⚠️ ¿Estás seguro de cerrar la caja? Esta acción no se puede deshacer.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={handleCerrar}
            disabled={loading || !efectivo}
            className={`flex-1 px-4 py-2 font-medium rounded-lg transition ${
              confirmado 
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' 
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
            } ${loading || !efectivo ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Cerrando...' : confirmado ? 'Sí, cerrar caja' : 'Confirmar Cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}