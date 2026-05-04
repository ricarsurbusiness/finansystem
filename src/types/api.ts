export interface SesionDiaria {
  id: string;
  usuario_id: string;
  fecha: string;
  base_inicial: number;
  refuerzos: number;
  efectivo_final: number;
  base_siguiente: number;
  estado: 'abierta' | 'cerrada';
  modificaciones?: number;
  created_at: string;
  closed_at?: string;
  // Campos calculados en cierre
  total_proveedor?: number;
  total_gastos?: number;
  total_disponible?: number;
  total_egresos?: number;
  total_dia?: number;
  ventas?: number;
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