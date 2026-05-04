import apiClient from './apiClient';
import {
  SesionDiaria,
  CreateSesionRequest,
  CerrarSesionRequest,
  Movimiento,
  Refuerzo,
} from '@/types/api';

export const sesionService = {
  async crear(data: CreateSesionRequest): Promise<SesionDiaria> {
    const response = await apiClient.post<SesionDiaria>('/api/sesiones', data);
    return response.data;
  },

  async obtenerTodas(): Promise<SesionDiaria[]> {
    const response = await apiClient.get<SesionDiaria[]>('/api/sesiones');
    return response.data;
  },

  async obtenerAbierta(): Promise<SesionDiaria> {
    const response = await apiClient.get<SesionDiaria>('/api/sesiones/abierta');
    return response.data;
  },

  async obtener(id: string): Promise<SesionDiaria> {
    const response = await apiClient.get<SesionDiaria>(`/api/sesiones/${id}`);
    return response.data;
  },

  async obtenerDetalle(id: string): Promise<SesionDiaria & { movimientos: Movimiento[]; refuerzos_list: Refuerzo[] }> {
    const response = await apiClient.get<SesionDiaria & { movimientos: Movimiento[]; refuerzos_list: Refuerzo[] }>(
      `/api/sesiones/${id}/detalle`
    );
    return response.data;
  },

  async cerrar(id: string, data: CerrarSesionRequest): Promise<SesionDiaria> {
    const response = await apiClient.post<SesionDiaria>(`/api/sesiones/${id}/close`, data);
    return response.data;
  },

  async obtenerUltimaCerrada(): Promise<SesionDiaria> {
    const response = await apiClient.get<SesionDiaria>('/api/sesiones/ultima-cerrada');
    return response.data;
  },

  // Movimientos
  async crearMovimiento(data: {
    sesion_id: string;
    detalle: string;
    monto: number;
    categoria: 'proveedor' | 'gasto';
    subcategoria?: string;
  }): Promise<Movimiento> {
    const response = await apiClient.post<Movimiento>('/api/movimientos', data);
    return response.data;
  },

  async obtenerMovimientos(sesionId: string): Promise<Movimiento[]> {
    const response = await apiClient.get<Movimiento[]>(`/api/movimientos?sesion_id=${sesionId}`);
    return response.data;
  },

  async actualizarMovimiento(id: string, sesionId: string, data: {
    detalle: string;
    monto: number;
    categoria: 'proveedor' | 'gasto';
    subcategoria?: string;
  }): Promise<void> {
    await apiClient.put(`/api/movimientos/${id}?sesion_id=${sesionId}`, data);
  },

  async eliminarMovimiento(id: string, sesionId: string): Promise<void> {
    await apiClient.delete(`/api/movimientos/${id}?sesion_id=${sesionId}`);
  },

  // Refuerzos
  async crearRefuerzo(data: { sesion_id: string; monto: number; observacion?: string }): Promise<Refuerzo> {
    const response = await apiClient.post<Refuerzo>('/api/refuerzos', data);
    return response.data;
  },

  async obtenerRefuerzos(sesionId: string): Promise<Refuerzo[]> {
    const response = await apiClient.get<Refuerzo[]>(`/api/refuerzos?sesion_id=${sesionId}`);
    return response.data;
  },

  async actualizarRefuerzo(id: string, sesionId: string, monto: number, observacion?: string): Promise<void> {
    await apiClient.put(`/api/refuerzos/${id}?sesion_id=${sesionId}`, { monto, observacion });
  },

  async eliminarRefuerzo(id: string, sesionId: string): Promise<void> {
    await apiClient.delete(`/api/refuerzos/${id}?sesion_id=${sesionId}`);
  },

  // Modificar sesión cerrada
  async modificar(sesionId: string, efectivoFinal: number, baseSiguiente: number): Promise<SesionDiaria> {
    const response = await apiClient.put<SesionDiaria>(`/api/sesiones/${sesionId}`, {
      efectivo_final: efectivoFinal,
      base_siguiente: baseSiguiente,
    });
    return response.data;
  },

  // Eliminar sesión cerrada
  async eliminar(sesionId: string): Promise<void> {
    await apiClient.delete(`/api/sesiones/${sesionId}`);
  },

  // Reportes
  async obtenerReporteSemanal(): Promise<{
    periodo: string;
    total_dias: number;
    total_base: number;
    total_refuerzos: number;
    total_proveedores: number;
    total_gastos: number;
    total_ventas: number;
    sesiones: Array<{
      fecha: string;
      base_inicial: number;
      refuerzos: number;
      efectivo_final: number;
      proveedores: number;
      gastos: number;
      ventas: number;
    }>;
  }> {
    const response = await apiClient.get('/api/reportes/semanal');
    return response.data;
  },

  async obtenerReporteMensual(year?: number, month?: number): Promise<{
    periodo: string;
    total_dias: number;
    total_base: number;
    total_refuerzos: number;
    total_proveedores: number;
    total_gastos: number;
    total_ventas: number;
    sesiones: Array<{
      fecha: string;
      base_inicial: number;
      refuerzos: number;
      efectivo_final: number;
      proveedores: number;
      gastos: number;
      ventas: number;
    }>;
  }> {
    let url = '/api/reportes/mensual';
    if (year && month) {
      url += `?year=${year}&month=${month}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  async exportarReporteMensualCSV(year?: number, month?: number): Promise<void> {
    let url = '/api/reportes/mensual/exportar';
    if (year && month) {
      url += `?year=${year}&month=${month}`;
    }
    const response = await apiClient.get(url, { responseType: 'blob' });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute('download', `reporte_mensual_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};