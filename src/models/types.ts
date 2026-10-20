export interface EntradaRequest {
  placa: string;
  observacionNovedad?: string;
}

export interface SalidaRequest {
  placa: string;
}

export interface RegistroAcceso {
  id_registro: number;
  placa: string;
  id_celda: number;
  numero_celda?: string;
  fecha_ingreso: string;
  fecha_salida: string | null;
  estado_registro: 'ACTIVO' | 'FINALIZADO';
}

export interface Novedad {
  id_novedad: number;
  id_registro: number;
  descripcion: string;
  fecha_registro: string;
}

export interface VehiculoConUsuario {
  placa: string;
  id_usuario: number;
  tipo_vehiculo: string;
  identificacion: string;
  nombre: string;
  telefono: string;
  estado_mensualidad: string;
}

export interface Presente {
  placa: string;
  numero_celda: string;
  fecha_ingreso: string;
  novedades: Novedad[];
}

export interface CeldaEstado {
  id_celda: number;
  numero_celda: string;
  estado: 'DISPONIBLE' | 'OCUPADA';
  placa: string | null;
  fecha_ingreso: string | null;
}

export interface EntradaResult {
  registro: RegistroAcceso;
  celda: string;
}

export interface SalidaResult {
  placa: string;
  fecha_salida: string;
  celda: string;
}