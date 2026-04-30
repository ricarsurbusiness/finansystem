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
    <form onSubmit={handleSubmit} style={styles.form}>
      {tipo === 'movimiento' && (
        <div style={styles.inputGroup}>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as 'proveedor' | 'gasto')}
            style={styles.select}
          >
            <option value="gasto">Gasto</option>
            <option value="proveedor">Proveedor</option>
          </select>
        </div>
      )}

      {tipo === 'movimiento' && (
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder={categoria === 'proveedor' ? 'Ej: Queso, Pollo' : 'Ej: Transporte, Servicios'}
            style={styles.input}
          />
        </div>
      )}

      {tipo === 'refuerzo' && (
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Observación (opcional)"
            style={styles.input}
          />
        </div>
      )}

      <div style={styles.inputGroup}>
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto"
          style={styles.input}
          min="0"
          step="0.01"
          required
        />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? 'Agregando...' : tipo === 'refuerzo' ? 'Agregar Refuerzo' : 'Agregar'}
      </button>
    </form>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inputGroup: {
    flex: '1 1 auto',
  },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    width: '100%',
  },
  select: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  button: {
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  error: {
    color: '#dc2626',
    fontSize: '12px',
    width: '100%',
  },
};