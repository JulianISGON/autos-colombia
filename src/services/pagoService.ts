import { MetodoPago } from '../models/types';
import * as pagoRepository from '../repositories/pagoRepository';

export class PagoError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

const metodosValidos: MetodoPago[] = [
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA_DEBITO',
  'TARJETA_CREDITO'
];

export async function registrarPago(
  identificacionInput: unknown,
  montoInput: unknown,
  metodoInput: unknown
) {
  if (typeof identificacionInput !== 'string' || !identificacionInput.trim()) {
    throw new PagoError(400, 'La identificación del usuario es obligatoria');
  }
  if (typeof montoInput !== 'number' || !Number.isInteger(montoInput) || montoInput <= 0) {
    throw new PagoError(400, 'El monto debe ser un entero mayor que cero');
  }
  if (typeof metodoInput !== 'string' || !metodosValidos.includes(metodoInput as MetodoPago)) {
    throw new PagoError(400, 'El método de pago no es válido');
  }

  const identificacion = identificacionInput.trim();
  const usuario = await pagoRepository.findUsuarioByIdentificacion(identificacion);
  if (!usuario) {
    throw new PagoError(404, 'El usuario no existe');
  }
  return pagoRepository.registrarPago(usuario.id_usuario, montoInput, metodoInput as MetodoPago);
}

export async function consultarPagos(identificacionInput?: unknown) {
  const identificacion = typeof identificacionInput === 'string' && identificacionInput.trim()
    ? identificacionInput.trim()
    : undefined;
  return pagoRepository.findPagos(identificacion);
}

export function consultarResumen() {
  return pagoRepository.findResumen();
}
