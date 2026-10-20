import { Request, Response } from 'express';
import * as accesoService from '../services/accesoService';

function handleError(error: unknown, response: Response): void {
  if (error instanceof accesoService.BusinessError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(error);
  response.status(500).json({ error: 'Error interno del servidor' });
}

export async function entrada(request: Request, response: Response): Promise<void> {
  try {
    const { placa, observacionNovedad } = request.body as { placa?: string; observacionNovedad?: string };
    if (!placa || typeof placa !== 'string') {
      response.status(400).json({ error: 'El campo placa es obligatorio' });
      return;
    }
    const result = await accesoService.registrarEntrada({ placa, observacionNovedad });
    response.status(201).json(result);
  } catch (error) {
    handleError(error, response);
  }
}

export async function salida(request: Request, response: Response): Promise<void> {
  try {
    const { placa } = request.body as { placa?: string };
    if (!placa || typeof placa !== 'string') {
      response.status(400).json({ error: 'El campo placa es obligatorio' });
      return;
    }
    response.status(200).json(await accesoService.registrarSalida(placa));
  } catch (error) {
    handleError(error, response);
  }
}

export async function presentes(_request: Request, response: Response): Promise<void> {
  try {
    response.status(200).json(await accesoService.obtenerPresentes());
  } catch (error) {
    handleError(error, response);
  }
}

export async function celdas(_request: Request, response: Response): Promise<void> {
  try {
    response.status(200).json(await accesoService.obtenerCeldas());
  } catch (error) {
    handleError(error, response);
  }
}