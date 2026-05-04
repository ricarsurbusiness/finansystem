'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { sesionService } from '@/services/sesionService';
import { SesionDiaria, Movimiento, Refuerzo } from '@/types/api';
import InicioDiaForm from '@/components/InicioDiaForm';
import MovimientoForm from '@/components/MovimientoForm';
import CierreModal from '@/components/CierreModal';
import EditarMovimientoModal from '@/components/EditarMovimientoModal';
import EditarRefuerzoModal from '@/components/EditarRefuerzoModal';
import HistorialDetalleModal from '@/components/HistorialDetalleModal';
import EditarSesionCerradaModal from '@/components/EditarSesionCerradaModal';

// Helper para formatear fecha evitando problemas de timezone
// Helper para formatear fecha evitando problemas de timezone (Colombia UTC-5)
function formatFecha(fechaStr: string) {
  const [year, month, day] = fechaStr.split('-').map(Number);
  // Crear fecha en hora local de Colombia
  return new Date(year, month - 1, day, 12, 0, 0);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sesion, setSesion] = useState<SesionDiaria | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [refuerzos, setRefuerzos] = useState<Refuerzo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCierre, setShowCierre] = useState(false);
  const [historial, setHistorial] = useState<SesionDiaria[]>([]);
  const [editMovimiento, setEditMovimiento] = useState<Movimiento | null>(null);
  const [editRefuerzo, setEditRefuerzo] = useState<Refuerzo | null>(null);
  const [historialDetalle, setHistorialDetalle] = useState<(SesionDiaria & { movimientos: Movimiento[]; refuerzos_list: Refuerzo[] }) | null>(null);
  const [editSesionCerrada, setEditSesionCerrada] = useState<SesionDiaria | null>(null);

  const verDetalleHistorial = async (sesionId: string) => {
    try {
      const detalle = await sesionService.obtenerDetalle(sesionId);
      setHistorialDetalle(detalle);
    } catch (e) {
      alert('Error al cargar detalle');
    }
  };

  const handleModificarSesion = async (efectivoFinal: number, baseSiguiente: number) => {
    if (!editSesionCerrada) return;
    try {
      await sesionService.modificar(editSesionCerrada.id, efectivoFinal, baseSiguiente);
      setEditSesionCerrada(null);
      loadData();
      alert('Sesión modificada correctamente');
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al modificar sesión');
    }
  };

  const handleEliminarSesion = async (sesionId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sesión? Solo se pueden eliminar sesiones sin movimientos.')) return;
    try {
      await sesionService.eliminar(sesionId);
      loadData();
      alert('Sesión eliminada');
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al eliminar sesión');
    }
  };

  const handleEliminarMovimiento = async (id: string) => {
    if (!sesion) return;
    if (confirm('¿Eliminar este movimiento?')) {
      await sesionService.eliminarMovimiento(id, sesion.id);
      loadData();
    }
  };

  const handleEliminarRefuerzo = async (id: string) => {
    if (!sesion) return;
    if (confirm('¿Eliminar este refuerzo?')) {
      await sesionService.eliminarRefuerzo(id, sesion.id);
      loadData();
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      const sesionAbierta = await sesionService.obtenerAbierta();
      setSesion(sesionAbierta);
      
      if (sesionAbierta) {
        const [moves, refs] = await Promise.all([
          sesionService.obtenerMovimientos(sesionAbierta.id),
          sesionService.obtenerRefuerzos(sesionAbierta.id),
        ]);
        setMovimientos(moves);
        setRefuerzos(refs);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSesion(null);
      }
    } finally {
      setLoading(false);
    }

    try {
      const hist = await sesionService.obtenerTodas();
      setHistorial(hist.filter(s => s.estado === 'cerrada'));
    } catch (e) {
      // Ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSesionCreada = (nuevaSesion: SesionDiaria) => {
    setSesion(nuevaSesion);
    setMovimientos([]);
    setRefuerzos([]);
  };

  const handleCierre = (resultado: SesionDiaria) => {
    setSesion(null);
    setShowCierre(false);
    loadData();
  };

  const totalProveedor = movimientos.filter(m => m.categoria === 'proveedor').reduce((sum, m) => sum + m.monto, 0);
  const totalGastos = movimientos.filter(m => m.categoria === 'gasto').reduce((sum, m) => sum + m.monto, 0);
  const totalRefuerzos = refuerzos.reduce((sum, r) => sum + r.monto, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Finansystem</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard/reportes')}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              📊 Reportes
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-500">Usuario</p>
              <p className="font-semibold text-gray-900">{user?.nombre}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!sesion && (
          <div className="max-w-md mx-auto">
            <InicioDiaForm onSesionCreada={handleSesionCreada} />
          </div>
        )}

        {sesion && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Sesión del día</p>
                    <h2 className="text-white text-2xl font-bold">{formatFecha(sesion.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                  </div>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-400 text-emerald-900">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></span>
                    Abierta
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-medium text-blue-600 mb-2">BASE INICIAL</p>
                    <p className="text-2xl font-bold text-blue-900">${sesion.base_inicial.toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-600 mb-2">REFUERZOS</p>
                    <p className="text-2xl font-bold text-emerald-900">${totalRefuerzos.toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                    <p className="text-xs font-medium text-amber-600 mb-2">PROVEEDORES</p>
                    <p className="text-2xl font-bold text-amber-900">${totalProveedor.toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <p className="text-xs font-medium text-red-600 mb-2">GASTOS</p>
                    <p className="text-2xl font-bold text-red-900">${totalGastos.toFixed(2)}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowCierre(true)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg"
                >
                  🔒 Cerrar Caja
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💰</span>
                  <h3 className="text-lg font-bold text-gray-900">Refuerzo</h3>
                </div>
                <MovimientoForm 
                  sesionId={sesion.id} 
                  tipo="refuerzo" 
                  onMovimientoAgregado={loadData}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-lg font-bold text-gray-900">Movimiento</h3>
                </div>
                <MovimientoForm 
                  sesionId={sesion.id} 
                  tipo="movimiento" 
                  onMovimientoAgregado={loadData}
                />
              </div>
            </div>

            {movimientos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">Movimientos del Día</h3>
                  <p className="text-sm text-gray-600">{movimientos.length} registro{movimientos.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Detalle</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Categoría</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Monto</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {movimientos.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {new Date(m.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{m.detalle || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              m.categoria === 'proveedor' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {m.categoria === 'proveedor' ? '🏢' : '📊'} {m.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-red-600 text-right">
                            -${m.monto.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setEditMovimiento(m)} 
                              className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleEliminarMovimiento(m.id)} 
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {refuerzos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">Refuerzos del Día</h3>
                  <p className="text-sm text-gray-600">{refuerzos.length} registro{refuerzos.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Observación</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Monto</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {refuerzos.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {new Date(r.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{r.observacion || '-'}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-emerald-600 text-right">
                            +${r.monto.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setEditRefuerzo(r)} 
                              className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleEliminarRefuerzo(r.id)} 
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {historial.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">📊 Historial de Cierres</h3>
              <p className="text-sm text-gray-600">{historial.length} sesión{historial.length !== 1 ? 'es' : ''} cerrada{historial.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="divide-y divide-gray-200">
              {historial.map(h => (
                <div key={h.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {formatFecha(h.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        <span className="ml-2 text-xs text-gray-500">(Mod: {(h.modificaciones || 0)}/3)</span>
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div className="text-gray-600">
                          Base: <span className="font-semibold text-gray-900">${h.base_inicial.toFixed(2)}</span>
                        </div>
                        <div className="text-gray-600">
                          Refuerzos: <span className="font-semibold text-emerald-600">${h.refuerzos?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="text-gray-600">
                          Efectivo: <span className="font-semibold text-blue-600">${h.efectivo_final?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="text-gray-600">
                          Ventas: <span className="font-semibold text-amber-600">${h.ventas?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button 
                        onClick={() => verDetalleHistorial(h.id)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition whitespace-nowrap"
                      >
                        Ver detalle
                      </button>
                      {(h.modificaciones || 0) < 3 && (
                        <button 
                          onClick={() => setEditSesionCerrada(h)}
                          className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition whitespace-nowrap"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      <button 
                        onClick={() => handleEliminarSesion(h.id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition whitespace-nowrap"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showCierre && sesion && (
        <CierreModal
          sesion={sesion}
          movimientos={movimientos}
          refuerzos={refuerzos}
          onCierre={handleCierre}
          onClose={() => setShowCierre(false)}
        />
      )}

      {editMovimiento && sesion && (
        <EditarMovimientoModal
          movimiento={editMovimiento}
          sesionId={sesion.id}
          onSave={() => { setEditMovimiento(null); loadData(); }}
          onClose={() => setEditMovimiento(null)}
        />
      )}

      {editRefuerzo && sesion && (
        <EditarRefuerzoModal
          refuerzo={editRefuerzo}
          sesionId={sesion.id}
          onSave={() => { setEditRefuerzo(null); loadData(); }}
          onClose={() => setEditRefuerzo(null)}
        />
      )}

      {historialDetalle && (
        <HistorialDetalleModal
          sesion={historialDetalle}
          onClose={() => setHistorialDetalle(null)}
        />
      )}

      {editSesionCerrada && (
        <EditarSesionCerradaModal
          sesion={editSesionCerrada}
          onSave={handleModificarSesion}
          onClose={() => setEditSesionCerrada(null)}
        />
      )}
    </div>
  );
}
