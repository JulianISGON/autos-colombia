import { Request, Response } from 'express';
import * as accesoService from '../services/accesoService';
import * as usuarioService from '../services/usuarioService';

function handleError(error: unknown, response: Response): void {
  if (error instanceof usuarioService.UserError) {
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

export async function crearUsuario(request: Request, response: Response): Promise<void> {
  try {
    const { identificacion, nombre, telefono, estado_mensualidad, placa, tipo_vehiculo } = request.body as {
      identificacion: string;
      nombre: string;
      telefono: string;
      estado_mensualidad: string;
      placa?: string;
      tipo_vehiculo?: string;
    };
    if (!identificacion || !nombre || !telefono || !estado_mensualidad) {
      response.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }
    const result = await usuarioService.crearUsuario(identificacion, nombre, telefono, estado_mensualidad, placa, tipo_vehiculo);
    response.status(201).json(result);
  } catch (error) {
    handleError(error, response);
  }
}

export async function actualizarUsuario(request: Request, response: Response): Promise<void> {
  try {
    const { identificacion, nombre, telefono, estado_mensualidad, placa, tipo_vehiculo } = request.body as {
      identificacion: string; nombre: string; telefono: string; estado_mensualidad: string; placa?: string; tipo_vehiculo?: string;
    };
    if (!identificacion || !nombre || !telefono || !estado_mensualidad) {
      response.status(400).json({ error: 'Identificación, nombre, teléfono y mensualidad son obligatorios' });
      return;
    }
    response.status(200).json(await usuarioService.actualizarUsuario(Number(request.params.id), identificacion, nombre, telefono, estado_mensualidad, placa, tipo_vehiculo));
  } catch (error) {
    handleError(error, response);
  }
}

export async function listarUsuarios(_request: Request, response: Response): Promise<void> {
  try {
    const users = await usuarioService.listarUsuarios();
    response.status(200).json(users);
  } catch (error) {
    handleError(error, response);
  }
}

export async function actualizarMensualidad(request: Request, response: Response): Promise<void> {
  try {
    const { id } = request.params;
    const { estado_mensualidad } = request.body as { estado_mensualidad: string };
    if (!estado_mensualidad) {
      response.status(400).json({ error: 'El estado de mensualidad es obligatorio' });
      return;
    }
    const result = await usuarioService.actualizarMensualidad(Number(id), estado_mensualidad);
    response.status(200).json(result);
  } catch (error) {
    handleError(error, response);
  }
}