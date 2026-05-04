'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { sesionService } from '@/services/sesionService';

// Helper para formatear fecha
function formatFecha(fechaStr: string) {
  const [year, month, day] = fechaStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface SesionReporte {
  fecha: string;
  base_inicial: number;
  refuerzos: number;
  efectivo_final: number;
  proveedores: number;
  gastos: number;
  ventas: number;
}

interface Reporte {
  periodo: string;
  total_dias: number;
  total_base: number;
  total_refuerzos: number;
  total_proveedores: number;
  total_gastos: number;
  total_ventas: number;
  sesiones: SesionReporte[];
}

export default function ReportesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [reporteSemanal, setReporteSemanal] = useState<Reporte | null>(null);
  const [reporteMensual, setReporteMensual] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'semanal' | 'mensual'>('mensual');
  
  // Estado para seleccionar mes
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadReportes();
  }, [isAuthenticated, router, selectedYear, selectedMonth]);

  const loadReportes = async () => {
    try {
      const [semanal, mensual] = await Promise.all([
        sesionService.obtenerReporteSemanal(),
        sesionService.obtenerReporteMensual(selectedYear, selectedMonth),
      ]);
      setReporteSemanal(semanal);
      setReporteMensual(mensual);
    } catch (e) {
      console.error('Error loading reportes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarCSV = async () => {
    try {
      await sesionService.exportarReporteMensualCSV(selectedYear, selectedMonth);
    } catch (e) {
      alert('Error al exportar');
    }
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  const reporte = activeTab === 'semanal' ? reporteSemanal : reporteMensual;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-gray-900">📊 Reportes</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('semanal')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'semanal'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Semana Actual
          </button>
          <button
            onClick={() => setActiveTab('mensual')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'mensual'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Reporte Mensual
          </button>
          
          {/* Selector de mes (solo para reporte mensual) */}
          {activeTab === 'mensual' && (
            <div className="flex items-center gap-2 ml-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((mes, i) => (
                  <option key={mes} value={i + 1}>{mes}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={handleExportarCSV}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition text-sm"
              >
                📥 Exportar
              </button>
            </div>
          )}
        </div>

        {reporte ? (
          <>
            {/* Resumen */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{reporte.periodo}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Días</p>
                  <p className="text-xl font-bold text-gray-900">{reporte.total_dias}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Base Total</p>
                  <p className="text-xl font-bold text-blue-600">${reporte.total_base.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Refuerzos</p>
                  <p className="text-xl font-bold text-emerald-600">${reporte.total_refuerzos.toFixed(2)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Proveedores</p>
                  <p className="text-xl font-bold text-amber-600">${reporte.total_proveedores.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Gastos</p>
                  <p className="text-xl font-bold text-red-600">${reporte.total_gastos.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Egresos</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${(reporte.total_proveedores + reporte.total_gastos).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Ventas</p>
                  <p className="text-xl font-bold text-green-600">${reporte.total_ventas.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Tabla de sesiones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Detalle Diario</h3>
              </div>
              {reporte.sesiones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Fecha</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Base</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Refuerzos</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Efectivo</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Proveedores</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Gastos</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Ventas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reporte.sesiones.map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatFecha(s.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">${s.base_inicial.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-emerald-600 text-right">+${s.refuerzos.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-blue-600 text-right">${s.efectivo_final.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-amber-600 text-right">-${s.proveedores.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-red-600 text-right">-${s.gastos.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">${s.ventas.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">TOTALES</td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">${reporte.total_base.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm font-bold text-emerald-600 text-right">${reporte.total_refuerzos.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-400 text-right">-</td>
                        <td className="px-6 py-3 text-sm font-bold text-amber-600 text-right">${reporte.total_proveedores.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm font-bold text-red-600 text-right">${reporte.total_gastos.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm font-bold text-green-600 text-right">${reporte.total_ventas.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No hay sesiones cerradas en este período
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No hay datos disponibles</p>
          </div>
        )}
      </main>
    </div>
  );
}