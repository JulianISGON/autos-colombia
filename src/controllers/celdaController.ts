import { Request, Response } from 'express';
import * as accesoService from '../services/accesoService';
import * as celdaService from '../services/celdaService';

function handleError(error: unknown, response: Response): void {
  if (error instanceof celdaService.CellError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof accesoService.BusinessError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(error);
  response.status(500).json({ error: 'Error interno del servidor' });
}

export async function crearCelda(request: Request, response: Response): Promise<void> {
  try {
    const { numero_celda } = request.body as { numero_celda: string };
    if (!numero_celda) {
      response.status(400).json({ error: 'El número de celda es obligatorio' });
      return;
    }
    const result = await celdaService.crearCelda(numero_celda);
    response.status(201).json(result);
  } catch (error) {
    handleError(error, response);
  }
}

export async function listarCeldas(_request: Request, response: Response): Promise<void> {
  try {
    const celdas = await celdaService.listarCeldas();
    response.status(200).json(celdas);
  } catch (error) {
    handleError(error, response);
  }
}

export async function actualizarEstadoCelda(request: Request, response: Response): Promise<void> {
  try {
    const { id } = request.params;
    const { estado } = request.body as { estado: 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO' };
    if (!estado) {
      response.status(400).json({ error: 'El estado de la celda es obligatorio' });
      return;
    }
    const result = await celdaService.actualizarEstadoCelda(Number(id), estado);
    response.status(200).json(result);
  } catch (error) {
    handleError(error, response);
  }
}