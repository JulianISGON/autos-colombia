import * as celdaRepository from '../repositories/celdaRepository';
import { CeldaEstado, EstadoCelda } from '../models/types';

export class CellError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export async function listarCeldas(): Promise<CeldaEstado[]> {
  return celdaRepository.findAll();
}

export async function crearCelda(numeroInput: string): Promise<{ id_celda: number; numero_celda: string; estado: 'DISPONIBLE' }> {
  const numero_celda = numeroInput.trim().toUpperCase();
  if (!numero_celda) {
    throw new CellError(400, 'El número de celda es obligatorio');
  }
  const existente = await celdaRepository.findByNumero(numero_celda);
  if (existente) {
    throw new CellError(400, 'Ya existe una celda con ese número');
  }
  const celda = await celdaRepository.create(numero_celda);
  return { id_celda: celda.id_celda, numero_celda: celda.numero_celda, estado: 'DISPONIBLE' };
}

export async function actualizarEstadoCelda(id_celda: number, estadoInput: string): Promise<CeldaEstado> {
  if (!Number.isInteger(id_celda) || id_celda <= 0) {
    throw new CellError(400, 'El identificador de la celda no es válido');
  }
  const estado = validarEstado(estadoInput);
  const existente = await celdaRepository.findById(id_celda);
  if (!existente) {
    throw new CellError(404, 'La celda no existe');
  }
  if (existente.placa && estado === 'DISPONIBLE') {
    throw new CellError(409, 'La celda ocupada debe liberarse mediante el registro de salida');
  }
  return celdaRepository.updateEstado(id_celda, estado);
}

function validarEstado(value: string): EstadoCelda {
  if (value !== 'DISPONIBLE' && value !== 'OCUPADA' && value !== 'MANTENIMIENTO') {
    throw new CellError(400, 'El estado debe ser DISPONIBLE, OCUPADA o MANTENIMIENTO');
  }
  return value;
}