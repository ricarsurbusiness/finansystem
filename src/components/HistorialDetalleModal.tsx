'use client';

import { SesionDiaria, Movimiento, Refuerzo } from '@/types/api';

interface Props {
  sesion: SesionDiaria & { movimientos: Movimiento[]; refuerzos_list: Refuerzo[] };
  onClose: () => void;
}

export default function HistorialDetalleModal({ sesion, onClose }: Props) {
  const movimientos = sesion.movimientos || [];
  const refuerzos = sesion.refuerzos_list || [];

  const totalProveedor = movimientos.filter(m => m.categoria === 'proveedor').reduce((sum, m) => sum + m.monto, 0);
  const totalGastos = movimientos.filter(m => m.categoria === 'gasto').reduce((sum, m) => sum + m.monto, 0);
  const totalRefuerzos = refuerzos.reduce((sum, r) => sum + r.monto, 0);

  // Cálculo de ventas: Efectivo_final - Base_inicial - Refuerzos + Proveedores + Gastos
  const ventasCalculadas = (sesion.efectivo_final || 0) - sesion.base_inicial - totalRefuerzos + totalProveedor + totalGastos;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">📋 Detalle del Cierre</h2>
          <button 
            onClick={onClose}
            className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Información de la Sesión</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-600 font-medium">Fecha:</span> {sesion.fecha}</div>
              <div><span className="text-gray-600 font-medium">Base Inicial:</span> ${sesion.base_inicial.toFixed(2)}</div>
              <div><span className="text-gray-600 font-medium">Efectivo Final:</span> ${(sesion.efectivo_final || 0).toFixed(2)}</div>
              <div><span className="text-gray-600 font-medium">Ventas:</span> <span className="text-blue-600 font-semibold">${ventasCalculadas.toFixed(2)}</span></div>
            </div>
          </div>

          {refuerzos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">💰 Refuerzos (${totalRefuerzos.toFixed(2)})</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Hora</th>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Observación</th>
                      <th className="px-4 py-2 text-right text-gray-700 font-semibold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {refuerzos.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{new Date(r.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-2">{r.observacion || '-'}</td>
                        <td className="px-4 py-2 text-right text-emerald-600 font-medium">+${r.monto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {movimientos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Movimientos (${totalProveedor.toFixed(2)} proveedores + ${totalGastos.toFixed(2)} gastos)</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Hora</th>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Detalle</th>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Categoría</th>
                      <th className="px-4 py-2 text-right text-gray-700 font-semibold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movimientos.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{new Date(m.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-2">{m.detalle || '-'}</td>
                        <td className="px-4 py-2">
                          <span className={m.categoria === 'proveedor' ? 'bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium' : 'bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium'}>
                            {m.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-red-600 font-medium">-${m.monto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 Resumen</h3>
            <div className="space-y-2 text-sm bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between"><span>Base Inicial:</span> <strong>${sesion.base_inicial.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>+ Refuerzos:</span> <strong className="text-emerald-600">${totalRefuerzos.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>- Proveedores:</span> <strong className="text-red-600">${totalProveedor.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>- Gastos:</span> <strong className="text-red-600">${totalGastos.toFixed(2)}</strong></div>
              <div className="border-t border-blue-200 my-2"></div>
              <div className="flex justify-between"><span>= Efectivo Esperado:</span> <strong>${(sesion.base_inicial + totalRefuerzos - totalProveedor - totalGastos).toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Efectivo Real:</span> <strong>${(sesion.efectivo_final || 0).toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Diferencia:</span> <strong className="text-blue-600">${((sesion.efectivo_final || 0) - (sesion.base_inicial + totalRefuerzos - totalProveedor - totalGastos)).toFixed(2)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}