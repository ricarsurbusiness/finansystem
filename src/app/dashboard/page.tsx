'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { sesionService } from '@/services/sesionService';
import { SesionDiaria } from '@/types/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sesionAbierta, setSesionAbierta] = useState<SesionDiaria | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadSesionAbierta();
  }, [isAuthenticated, router]);

  const loadSesionAbierta = async () => {
    try {
      const sesion = await sesionService.obtenerAbierta();
      setSesionAbierta(sesion);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSesionAbierta(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

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
        {sesionAbierta ? (
          <div style={styles.sesionCard}>
            <h2>Sesión Abierta</h2>
            <p>Fecha: {sesionAbierta.fecha}</p>
            <p>Base Inicial: ${sesionAbierta.base_inicial.toFixed(2)}</p>
            <p>Refuerzos: ${sesionAbierta.refuerzos.toFixed(2)}</p>
            <button style={styles.actionBtn}>
              Ver Detalle →
            </button>
          </div>
        ) : (
          <div style={styles.noSesion}>
            <h2>¿Estás listo para empezar el día?</h2>
            <p>Aún no has iniciado una sesión hoy.</p>
            <button style={styles.primaryBtn}>
              Iniciar Día
            </button>
          </div>
        )}

        <div style={styles.historialCard}>
          <h3>Historial de Cierres</h3>
          <p style={styles.empty}>No hay cierres anteriores</p>
        </div>
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  main: {
    padding: '32px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  sesionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  noSesion: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '48px 24px',
    textAlign: 'center',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  primaryBtn: {
    padding: '14px 28px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
  },
  actionBtn: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '16px',
  },
  historialCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  empty: {
    color: '#6b7280',
    fontSize: '14px',
  },
};