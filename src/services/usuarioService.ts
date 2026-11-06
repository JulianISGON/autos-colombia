import * as usuarioRepository from '../repositories/usuarioRepository';
import { EstadoMensualidad, Usuario, UsuarioConVehiculos } from '../models/types';

export class UserError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export async function listarUsuarios(): Promise<UsuarioConVehiculos[]> {
  return usuarioRepository.findAllWithVehiculos();
}

export async function crearUsuario(identificacionInput: string, nombreInput: string, telefonoInput: string, estadoInput: string, placaInput?: string, tipoVehiculoInput?: string): Promise<UsuarioConVehiculos> {
  const identificacion = identificacionInput.trim();
  const nombre = nombreInput.trim();
  const telefono = telefonoInput.trim();
  const placa = placaInput?.trim().toUpperCase();
  const tipoVehiculo = tipoVehiculoInput?.trim().toUpperCase();
  const estado_mensualidad = validarEstado(estadoInput);
  if (!identificacion || !nombre || !telefono) {
    throw new UserError(400, 'Identificación, nombre y teléfono son obligatorios');
  }
  validarVehiculo(placa, tipoVehiculo);
  const existente = await usuarioRepository.findByIdentificacion(identificacion);
  if (existente) {
    throw new UserError(400, 'Ya existe un usuario con esa identificación');
  }
  if (placa && await usuarioRepository.findVehiculoByPlaca(placa)) {
    throw new UserError(400, 'La placa ya se encuentra asociada a otro usuario');
  }
  return usuarioRepository.create(identificacion, nombre, telefono, estado_mensualidad, placa, tipoVehiculo);
}

export async function actualizarUsuario(id_usuario: number, identificacionInput: string, nombreInput: string, telefonoInput: string, estadoInput: string, placaInput?: string, tipoVehiculoInput?: string): Promise<UsuarioConVehiculos> {
  validarId(id_usuario);
  const identificacion = identificacionInput.trim();
  const nombre = nombreInput.trim();
  const telefono = telefonoInput.trim();
  const placa = placaInput?.trim().toUpperCase();
  const tipoVehiculo = tipoVehiculoInput?.trim().toUpperCase();
  if (!identificacion || !nombre || !telefono) throw new UserError(400, 'Identificación, nombre y teléfono son obligatorios');
  const estado_mensualidad = validarEstado(estadoInput);
  validarVehiculo(placa, tipoVehiculo);
  const user = await usuarioRepository.findById(id_usuario);
  if (!user) throw new UserError(404, 'El usuario no existe');
  const duplicate = await usuarioRepository.findByIdentificacion(identificacion);
  if (duplicate && duplicate.id_usuario !== id_usuario) throw new UserError(400, 'Ya existe un usuario con esa identificación');
  if (placa) {
    const vehicle = await usuarioRepository.findVehiculoByPlaca(placa);
    if (vehicle && vehicle.id_usuario !== id_usuario) throw new UserError(400, 'La placa ya se encuentra asociada a otro usuario');
  }
  return usuarioRepository.updateProfile(id_usuario, identificacion, nombre, telefono, estado_mensualidad, placa, tipoVehiculo);
}

export async function actualizarMensualidad(id_usuario: number, estadoInput: string): Promise<Usuario> {
  validarId(id_usuario);
  const estado_mensualidad = validarEstado(estadoInput);
  const existente = await usuarioRepository.findById(id_usuario);
  if (!existente) {
    throw new UserError(404, 'El usuario no existe');
  }
  return usuarioRepository.updateMensualidad(id_usuario, estado_mensualidad);
}

function validarEstado(value: string): EstadoMensualidad {
  if (value !== 'ACTIVA' && value !== 'VENCIDA') {
    throw new UserError(400, 'El estado de mensualidad debe ser ACTIVA o VENCIDA');
  }
  return value;
}

function validarId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new UserError(400, 'El identificador del usuario no es válido');
  }
}

function validarVehiculo(placa?: string, tipoVehiculo?: string): void {
  if (!placa && tipoVehiculo) throw new UserError(400, 'El tipo de vehículo requiere una placa');
  if (placa && !/^[A-Z0-9-]{3,8}$/.test(placa)) throw new UserError(400, 'La placa no tiene un formato válido');
}