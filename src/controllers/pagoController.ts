import { Request, Response } from 'express';
import * as pagoService from '../services/pagoService';

function handleError(error: unknown, response: Response): void {
  if (error instanceof pagoService.PagoError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(error);
  response.status(500).json({ error: 'Error interno del servidor' });
}

export async function crearPago(request: Request, response: Response): Promise<void> {
  try {
    const body = request.body as { identificacion?: unknown; monto?: unknown; metodo_pago?: unknown; metodo?: unknown };
    const metodo = body.metodo_pago ?? body.metodo;
    const pago = await pagoService.registrarPago(body.identificacion, body.monto, metodo);
    response.status(201).json(pago);
  } catch (error) {
    handleError(error, response);
  }
}

export async function listarPagos(request: Request, response: Response): Promise<void> {
  try {
    const pagos = await pagoService.consultarPagos(request.query.identificacion);
    response.status(200).json(pagos);
  } catch (error) {
    handleError(error, response);
  }
}

export async function listarResumen(_request: Request, response: Response): Promise<void> {
  try {
    response.status(200).json(await pagoService.consultarResumen());
  } catch (error) {
    handleError(error, response);
  }
}
