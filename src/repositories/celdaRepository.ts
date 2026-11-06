import { database } from '../config/database';
import { CeldaEstado } from '../models/types';

function run(sql: string, parameters: unknown[] = []): Promise<any> {
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

export async function findAll(): Promise<CeldaEstado[]> {
  return all<CeldaEstado>(
    'SELECT c.id_celda, c.numero_celda, c.estado, r.placa, r.fecha_ingreso FROM celda c LEFT JOIN registro_acceso r ON r.id_celda = c.id_celda AND r.estado_registro = ? ORDER BY c.id_celda',
    ['ACTIVO']
  );
}

export async function findDisponible(): Promise<{ id_celda: number; numero_celda: string } | undefined> {
  return get<{ id_celda: number; numero_celda: string }>(
    'SELECT id_celda, numero_celda FROM celda WHERE estado = ? ORDER BY id_celda LIMIT 1',
    ['DISPONIBLE']
  );
}

export async function findByNumero(numero_celda: string): Promise<CeldaEstado | undefined> {
  return get<CeldaEstado>(
    'SELECT c.id_celda, c.numero_celda, c.estado, r.placa, r.fecha_ingreso FROM celda c LEFT JOIN registro_acceso r ON r.id_celda = c.id_celda AND r.estado_registro = ? WHERE c.numero_celda = ? ORDER BY c.id_celda',
    ['ACTIVO', numero_celda]
  );
}

export async function findById(id_celda: number): Promise<CeldaEstado | undefined> {
  return get<CeldaEstado>(
    'SELECT c.id_celda, c.numero_celda, c.estado, r.placa, r.fecha_ingreso FROM celda c LEFT JOIN registro_acceso r ON r.id_celda = c.id_celda AND r.estado_registro = ? WHERE c.id_celda = ? LIMIT 1',
    ['ACTIVO', id_celda]
  );
}

export async function create(numero_celda: string): Promise<CeldaEstado> {
  const result = await run(
    'INSERT INTO celda (numero_celda, estado) VALUES (?, ?)',
    [numero_celda, 'DISPONIBLE']
  );
  const celda = await get<CeldaEstado>(
    'SELECT c.id_celda, c.numero_celda, c.estado, r.placa, r.fecha_ingreso FROM celda c LEFT JOIN registro_acceso r ON r.id_celda = c.id_celda AND r.estado_registro = ? WHERE c.id_celda = ? ORDER BY c.id_celda LIMIT 1',
    ['ACTIVO', result.lastID]
  );
  if (!celda) {
    throw new Error('No fue posible recuperar la celda creada');
  }
  return celda;
}

export async function updateEstado(id_celda: number, estado: 'DISPONIBLE' | 'OCUPADA' | 'MANTENIMIENTO'): Promise<CeldaEstado> {
  await run('UPDATE celda SET estado = ? WHERE id_celda = ?', [estado, id_celda]);
  const celda = await get<CeldaEstado>(
    'SELECT c.id_celda, c.numero_celda, c.estado, r.placa, r.fecha_ingreso FROM celda c LEFT JOIN registro_acceso r ON r.id_celda = c.id_celda AND r.estado_registro = ? WHERE c.id_celda = ? ORDER BY c.id_celda LIMIT 1',
    ['ACTIVO', id_celda]
  );
  if (!celda) {
    throw new Error('No fue posible recuperar la celda actualizada');
  }
  return celda;
}