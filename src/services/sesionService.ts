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
    const response = await apiClient.get<Movimiento[]>(`/api/movimientos/${sesionId}`);
    return response.data;
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
    const response = await apiClient.get<Refuerzo[]>(`/api/refuerzos/${sesionId}`);
    return response.data;
  },
};