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
      // Cargar sesión abierta
      const sesionAbierta = await sesionService.obtenerAbierta();
      setSesion(sesionAbierta);
      
      if (sesionAbierta) {
        // Cargar movimientos y refuerzos
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

    // Cargar historial
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
      <div style={styles.container}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Finansystem</h1>
        <div style={styles.userInfo}>
          <span>{user?.nombre}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Si no hay sesión, mostrar formulario de inicio */}
        {!sesion && (
          <InicioDiaForm onSesionCreada={handleSesionCreada} />
        )}

        {/* Si hay sesión abierta, mostrar dashboard */}
        {sesion && (
          <>
            <div style={styles.sesionCard}>
              <div style={styles.sesionHeader}>
                <h2>Sesión del {sesion.fecha}</h2>
                <span style={styles.estado}>Abierta</span>
              </div>

              <div style={styles.resumenBox}>
                <div style={styles.resumenItem}>
                  <span style={styles.resumenLabel}>Base Inicial</span>
                  <span style={styles.resumenValue}>${sesion.base_inicial.toFixed(2)}</span>
                </div>
                <div style={styles.resumenItem}>
                  <span style={styles.resumenLabel}>Refuerzos</span>
                  <span style={styles.resumenValue}>${totalRefuerzos.toFixed(2)}</span>
                </div>
                <div style={styles.resumenItem}>
                  <span style={styles.resumenLabel}>Proveedores</span>
                  <span style={styles.resumenValue}>${totalProveedor.toFixed(2)}</span>
                </div>
                <div style={styles.resumenItem}>
                  <span style={styles.resumenLabel}>Gastos</span>
                  <span style={styles.resumenValue}>${totalGastos.toFixed(2)}</span>
                </div>
              </div>

              <div style={styles.actions}>
                <button onClick={() => setShowCierre(true)} style={styles.cierreBtn}>
                  Cerrar Caja
                </button>
              </div>
            </div>

            {/* Sección de Refuerzos */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Agregar Refuerzo</h3>
              <MovimientoForm 
                sesionId={sesion.id} 
                tipo="refuerzo" 
                onMovimientoAgregado={loadData}
              />
            </div>

            {/* Sección de Movimientos */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Agregar Movimiento</h3>
              <MovimientoForm 
                sesionId={sesion.id} 
                tipo="movimiento" 
                onMovimientoAgregado={loadData}
              />
            </div>

            {/* Lista de Movimientos */}
            {movimientos.length > 0 && (
              <div style={styles.listaCard}>
                <h3>Movimientos del Día</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Detalle</th>
                      <th>Categoría</th>
                      <th>Monto</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map(m => (
                      <tr key={m.id}>
                        <td>{new Date(m.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{m.detalle || '-'}</td>
                        <td>
                          <span style={m.categoria === 'proveedor' ? styles.tagProveedor : styles.tagGasto}>
                            {m.categoria}
                          </span>
                        </td>
                        <td style={styles.montoNegativo}>-${m.monto.toFixed(2)}</td>
                        <td>
                          <button onClick={() => setEditMovimiento(m)} style={styles.editBtn}>✏️</button>
                          <button onClick={() => handleEliminarMovimiento(m.id)} style={styles.deleteBtn}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Lista de Refuerzos */}
            {refuerzos.length > 0 && (
              <div style={styles.listaCard}>
                <h3>Refuerzos del Día</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Observación</th>
                      <th>Monto</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {refuerzos.map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{r.observacion || '-'}</td>
                        <td style={styles.montoPositivo}>+${r.monto.toFixed(2)}</td>
                        <td>
                          <button onClick={() => setEditRefuerzo(r)} style={styles.editBtn}>✏️</button>
                          <button onClick={() => handleEliminarRefuerzo(r.id)} style={styles.deleteBtn}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Historial de Cierres */}
        {historial.length > 0 && (
          <div style={styles.historialCard}>
            <h3>Historial de Cierres</h3>
            {historial.map(h => (
              <div key={h.id} style={styles.historialItem}>
                <span>{h.fecha}</span>
                <span>Ventas: ${h.ventas?.toFixed(2) || '0.00'}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Cierre */}
      {showCierre && sesion && (
        <CierreModal
          sesion={sesion}
          movimientos={movimientos}
          refuerzos={refuerzos}
          onCierre={handleCierre}
          onClose={() => setShowCierre(false)}
        />
      )}

      {/* Modal de Editar Movimiento */}
      {editMovimiento && sesion && (
        <EditarMovimientoModal
          movimiento={editMovimiento}
          sesionId={sesion.id}
          onSave={() => { setEditMovimiento(null); loadData(); }}
          onClose={() => setEditMovimiento(null)}
        />
      )}

      {/* Modal de Editar Refuerzo */}
      {editRefuerzo && sesion && (
        <EditarRefuerzoModal
          refuerzo={editRefuerzo}
          sesionId={sesion.id}
          onSave={() => { setEditRefuerzo(null); loadData(); }}
          onClose={() => setEditRefuerzo(null)}
        />
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: 'white',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoutBtn: { padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', backgroundColor: 'white' },
  main: { padding: '32px', maxWidth: '800px', margin: '0 auto' },
  sesionCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
  sesionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  estado: { padding: '4px 12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  resumenBox: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' },
  resumenItem: { textAlign: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
  resumenLabel: { display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
  resumenValue: { fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' },
  actions: { display: 'flex', justifyContent: 'center', marginTop: '16px' },
  cierreBtn: { padding: '12px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  section: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' },
  listaCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tagProveedor: { padding: '2px 8px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '12px' },
  tagGasto: { padding: '2px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontSize: '12px' },
  montoNegativo: { color: '#dc2626', fontWeight: '500' },
  montoPositivo: { color: '#059669', fontWeight: '500' },
  editBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', marginLeft: '8px' },
  historialCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
  historialItem: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' },
};