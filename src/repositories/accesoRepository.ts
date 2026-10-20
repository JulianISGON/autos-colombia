import { database } from '../config/database';
import { CeldaEstado, Novedad, RegistroAcceso, VehiculoConUsuario } from '../models/types';
import sqlite3 from 'sqlite3';

function run(sql: string, parameters: unknown[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    database.run(sql, parameters, function (error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function get<T>(sql: string, parameters: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    database.get(sql, parameters, (error, row) => {
      if (error) reject(error);
      else resolve(row as T | undefined);
    });
  });
}

function all<T>(sql: string, parameters: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    database.all(sql, parameters, (error, rows) => {
      if (error) reject(error);
      else resolve(rows as T[]);
    });
  });
}

export async function findVehiculoConUsuario(placa: string): Promise<VehiculoConUsuario | undefined> {
  return get<VehiculoConUsuario>(`SELECT v.placa, v.id_usuario, v.tipo_vehiculo,
    u.identificacion, u.nombre, u.telefono, u.estado_mensualidad
    FROM vehiculo v JOIN usuario u ON u.id_usuario = v.id_usuario WHERE v.placa = ?`, [placa]);
}

export function findRegistroActivo(placa: string): Promise<RegistroAcceso | undefined> {
  return get<RegistroAcceso>(`SELECT r.*, c.numero_celda
    FROM registro_acceso r JOIN celda c ON c.id_celda = r.id_celda
    WHERE r.placa = ? AND r.estado_registro = ? LIMIT 1`, [placa, 'ACTIVO']);
}

export function findCeldaDisponible(): Promise<{ id_celda: number; numero_celda: string } | undefined> {
  return get<{ id_celda: number; numero_celda: string }>('SELECT id_celda, numero_celda FROM celda WHERE estado = ? ORDER BY id_celda LIMIT 1', ['DISPONIBLE']);
}

export async function createEntrada(placa: string, idCelda: number, fechaIngreso: string, observacion?: string): Promise<RegistroAcceso> {
  await run('BEGIN TRANSACTION');
  try {
    const result = await run(`INSERT INTO registro_acceso
      (placa, id_celda, fecha_ingreso, estado_registro) VALUES (?, ?, ?, ?)`, [placa, idCelda, fechaIngreso, 'ACTIVO']);
    await run('UPDATE celda SET estado = ? WHERE id_celda = ?', ['OCUPADA', idCelda]);
    if (observacion) {
      await run('INSERT INTO novedad (id_registro, descripcion, fecha_registro) VALUES (?, ?, ?)', [result.lastID, observacion, fechaIngreso]);
    }
    await run('COMMIT');
    const registro = await get<RegistroAcceso>('SELECT * FROM registro_acceso WHERE id_registro = ?', [result.lastID]);
    if (!registro) throw new Error('No fue posible recuperar el registro creado');
    return registro;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function finalizarRegistro(registro: RegistroAcceso, fechaSalida: string): Promise<void> {
  await run('BEGIN TRANSACTION');
  try {
    await run('UPDATE registro_acceso SET fecha_salida = ?, estado_registro = ? WHERE id_registro = ?', [fechaSalida, 'FINALIZADO', registro.id_registro]);
    await run('UPDATE celda SET estado = ? WHERE id_celda = ?', ['DISPONIBLE', registro.id_celda]);
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function findPresentes(): Promise<Array<RegistroAcceso & { numero_celda: string }>> {
  return all<RegistroAcceso & { numero_celda: string }>(`SELECT r.*, c.numero_celda
    FROM registro_acceso r JOIN celda c ON c.id_celda = r.id_celda
    WHERE r.estado_registro = ? ORDER BY r.fecha_ingreso`, ['ACTIVO']);
}

export function findNovedades(idRegistro: number): Promise<Novedad[]> {
  return all<Novedad>('SELECT * FROM novedad WHERE id_registro = ? ORDER BY fecha_registro', [idRegistro]);
}

export function findCeldas(): Promise<CeldaEstado[]> {
  return all<CeldaEstado>(`SELECT c.id_celda, c.numero_celda, c.estado,
    r.placa, r.fecha_ingreso
    FROM celda c LEFT JOIN registro_acceso r
    ON r.id_celda = c.id_celda AND r.estado_registro = ?
    ORDER BY c.id_celda`, ['ACTIVO']);
}