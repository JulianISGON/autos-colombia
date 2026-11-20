export interface EntradaRequest {
  placa: string;
  observacionNovedad?: string;
}

export type EstadoMensualidad = 'ACTIVA' | 'VENCIDA';
export type EstadoCelda = 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO';

export interface Usuario {
  id_usuario: number;
  identificacion: string;
  nombre: string;
  telefono: string;
  estado_mensualidad: EstadoMensualidad;
}

export interface Vehiculo {
  placa: string;
  id_usuario: number;
  tipo_vehiculo: string;
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
  estado_mensualidad: EstadoMensualidad;
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
  estado: EstadoCelda;
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

export interface UsuarioConVehiculos extends Usuario {
  vehiculos: Vehiculo[];
}

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO';
export type EstadoPago = 'PAGADO';

export interface Pago {
  id_pago: number;
  codigo_comprobante: string;
  id_usuario: number;
  monto: number;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
  fecha_pago: string;
}

export interface PagoConUsuario extends Pago {
  identificacion: string;
  nombre: string;
}

export interface PagoRegistroRequest {
  identificacion: string;
  monto: number;
  metodo_pago: MetodoPago;
}

export interface ResumenCuentaUsuario {
  id_usuario: number;
  identificacion: string;
  nombre: string;
  estado_mensualidad: EstadoMensualidad;
  estado_cuenta: 'AL DIA' | 'EN MORA';
  ultimo_pago: PagoConUsuario | null;
}