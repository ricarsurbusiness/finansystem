'use client';

import { useState } from 'react';
import { sesionService } from '@/services/sesionService';

interface InicioDiaFormProps {
  onSesionCreada: (sesion: any) => void;
}

export default function InicioDiaForm({ onSesionCreada }: InicioDiaFormProps) {
  const [baseInicial, setBaseInicial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const sesion = await sesionService.crear({ base_inicial: parseFloat(baseInicial) });
      onSesionCreada(sesion);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar el día');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>¿Estás listo para empezar el día?</h2>
      <p style={styles.subtitle}>Ingresa el efectivo base con el questartás la jornada</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Base Inicial ($)</label>
          <input
            type="number"
            value={baseInicial}
            onChange={(e) => setBaseInicial(e.target.value)}
            style={styles.input}
            placeholder="Ej: 100"
            min="0"
            step="0.01"
            required
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Iniciando...' : 'Iniciar Día'}
        </button>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '300px',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'left',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '18px',
    textAlign: 'center',
  },
  button: {
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
    padding: '8px',
    backgroundColor: '#fee2e2',
    borderRadius: '6px',
  },
};