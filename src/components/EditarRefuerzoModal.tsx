'use client';

import { useState } from 'react';
import { sesionService } from '@/services/sesionService';

interface Props {
  refuerzo: any;
  sesionId: string;
  onSave: () => void;
  onClose: () => void;
}

export default function EditarRefuerzoModal({ refuerzo, sesionId, onSave, onClose }: Props) {
  const [monto, setMonto] = useState(refuerzo.monto.toString());
  const [observacion, setObservacion] = useState(refuerzo.observacion || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sesionService.actualizarRefuerzo(refuerzo.id, sesionId, parseFloat(monto), observacion || undefined);
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>Editar Refuerzo</h3>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>Monto</label>
            <input type="number" value={monto} onChange={e => setMonto(e.target.value)} style={styles.input} step="0.01" min="0" />
          </div>
          <div style={styles.field}>
            <label>Observación</label>
            <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)} style={styles.input} />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.buttons}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancelar</button>
            <button type="submit" style={styles.saveBtn} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: any = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '350px' },
  title: { marginBottom: '20px', fontSize: '18px', fontWeight: '600' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
  buttons: { display: 'flex', gap: '12px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' },
  saveBtn: { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: '14px', marginTop: '10px' },
};