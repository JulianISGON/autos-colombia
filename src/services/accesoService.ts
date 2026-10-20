import * as accesoRepository from '../repositories/accesoRepository';
import { CeldaEstado, EntradaRequest, EntradaResult, Presente, SalidaResult } from '../models/types';

export class BusinessError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export async function registrarEntrada(request: EntradaRequest): Promise<EntradaResult> {
  const placa = request.placa.trim().toUpperCase();
  const observacion = request.observacionNovedad?.trim();
  const vehiculo = await accesoRepository.findVehiculoConUsuario(placa);
  if (!vehiculo || vehiculo.estado_mensualidad === 'VENCIDA') {
    throw new BusinessError(403, 'Acceso no autorizado: Mensualidad vencida o vehículo no registrado');
  }
  if (await accesoRepository.findRegistroActivo(placa)) {
    throw new BusinessError(400, 'El vehículo ya se encuentra dentro del parqueadero');
  }
  const celda = await accesoRepository.findCeldaDisponible();
  if (!celda) {
    throw new BusinessError(409, 'Parqueadero lleno: No hay celdas disponibles');
  }
  const registro = await accesoRepository.createEntrada(placa, celda.id_celda, new Date().toISOString(), observacion);
  return { registro, celda: celda.numero_celda };
}

export async function registrarSalida(placaInput: string): Promise<SalidaResult> {
  const placa = placaInput.trim().toUpperCase();
  const registro = await accesoRepository.findRegistroActivo(placa);
  if (!registro) {
    throw new BusinessError(404, 'El vehículo no se encuentra dentro del parqueadero');
  }
  const fechaSalida = new Date().toISOString();
  await accesoRepository.finalizarRegistro(registro, fechaSalida);
  const celdaLiberada = registro.numero_celda ?? `ID ${registro.id_celda}`;
  return { placa, fecha_salida: fechaSalida, celda: celdaLiberada };
}

export async function obtenerPresentes(): Promise<Presente[]> {
  const registros = await accesoRepository.findPresentes();
  return Promise.all(registros.map(async (registro) => ({
    placa: registro.placa,
    numero_celda: registro.numero_celda,
    fecha_ingreso: registro.fecha_ingreso,
    novedades: await accesoRepository.findNovedades(registro.id_registro)
  })));
}

export function obtenerCeldas(): Promise<CeldaEstado[]> {
  return accesoRepository.findCeldas();
}