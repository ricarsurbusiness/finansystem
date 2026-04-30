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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Cierre de Caja</h2>
        
        <div style={styles.resumen}>
          <div style={styles.row}>
            <span>Base Inicial:</span>
            <span>${sesion.base_inicial.toFixed(2)}</span>
          </div>
          <div style={styles.row}>
            <span>Refuerzos:</span>
            <span>+${totalRefuerzos.toFixed(2)}</span>
          </div>
          <div style={styles.divider}></div>
          <div style={styles.row}>
            <span style={styles.bold}>Total Disponible:</span>
            <span style={styles.bold}>${totalDisponible.toFixed(2)}</span>
          </div>
        </div>

        <div style={styles.resumen}>
          <div style={styles.row}>
            <span>Compras a Proveedores:</span>
            <span>-${totalProveedor.toFixed(2)}</span>
          </div>
          <div style={styles.row}>
            <span>Otros Gastos:</span>
            <span>-${totalGastos.toFixed(2)}</span>
          </div>
          <div style={styles.divider}></div>
          <div style={styles.row}>
            <span style={styles.bold}>Total Egresos:</span>
            <span style={styles.bold}>${totalEgresos.toFixed(2)}</span>
          </div>
        </div>

        <div style={styles.inputSection}>
          <label style={styles.label}>Efectivo en Caja ($)</label>
          <input
            type="number"
            value={efectivo}
            onChange={(e) => setEfectivo(e.target.value)}
            style={styles.input}
            placeholder="Ej: 200"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div style={styles.resultado}>
          <div style={styles.row}>
            <span>TOTAL DEL DÍA:</span>
            <span style={styles.totalNum}>${totalDia.toFixed(2)}</span>
          </div>
          <div style={styles.row}>
            <span>VENTAS (implícitas):</span>
            <span style={styles.ventasNum}>${ventas.toFixed(2)}</span>
          </div>
        </div>

        <div style={styles.inputSection}>
          <label style={styles.label}>Base para mañana ($)</label>
          <input
            type="number"
            value={baseSiguiente}
            onChange={(e) => setBaseSiguiente(e.target.value)}
            style={styles.input}
            min="0"
            step="0.01"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.buttons}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancelar</button>
          <button onClick={handleCerrar} style={styles.confirmBtn} disabled={loading || !efectivo}>
            {loading ? 'Cerrando...' : 'Confirmar Cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
  },
  resumen: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  divider: {
    borderBottom: '1px solid #e5e7eb',
    margin: '8px 0',
  },
  bold: {
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
  },
  resultado: {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  },
  totalNum: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  ventasNum: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#059669',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
    textAlign: 'center',
    padding: '8px',
    backgroundColor: '#fee2e2',
    borderRadius: '6px',
  },
};