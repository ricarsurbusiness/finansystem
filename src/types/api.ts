export interface SesionDiaria {
  id: string;
  usuario_id: string;
  fecha: string;
  base_inicial: number;
  refuerzos: number;
  efectivo_final: number;
  base_siguiente: number;
  estado: 'abierta' | 'cerrada';
  created_at: string;
  closed_at?: string;
}

export interface Movimiento {
  id: string;
  sesion_id: string;
  detalle: string;
  monto: number;
  categoria: 'proveedor' | 'gasto';
  subcategoria?: string;
  hora: string;
  created_at: string;
}

export interface Refuerzo {
  id: string;
  sesion_id: string;
  monto: number;
  observacion?: string;
  hora: string;
  created_at: string;
}

export interface CreateSesionRequest {
  base_inicial: number;
}

export interface CerrarSesionRequest {
  efectivo_final: number;
  base_siguiente: number;
}

export interface CreateMovimientoRequest {
  sesion_id: string;
  detalle: string;
  monto: number;
  categoria: 'proveedor' | 'gasto';
  subcategoria?: string;
}

export interface CreateRefuerzoRequest {
  sesion_id: string;
  monto: number;
  observacion?: string;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = T | ApiError;