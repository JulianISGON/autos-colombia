import { database } from '../config/database';
import { EstadoMensualidad, Usuario, UsuarioConVehiculos, Vehiculo } from '../models/types';

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

export async function findByIdentificacion(identificacion: string): Promise<Usuario | undefined> {
  return get<Usuario>(
    'SELECT id_usuario, identificacion, nombre, telefono, estado_mensualidad FROM usuario WHERE identificacion = ?',
    [identificacion]
  );
}

export async function findVehiculoByPlaca(placa: string): Promise<Vehiculo | undefined> {
  return get<Vehiculo>('SELECT placa, id_usuario, tipo_vehiculo FROM vehiculo WHERE placa = ?', [placa]);
}

export async function findById(id_usuario: number): Promise<Usuario | undefined> {
  return get<Usuario>(
    'SELECT id_usuario, identificacion, nombre, telefono, estado_mensualidad FROM usuario WHERE id_usuario = ?',
    [id_usuario]
  );
}

export async function findAll(): Promise<Usuario[]> {
  return all<Usuario>(
    'SELECT id_usuario, identificacion, nombre, telefono, estado_mensualidad FROM usuario ORDER BY nombre'
  );
}

export async function findAllWithVehiculos(): Promise<UsuarioConVehiculos[]> {
  const rows = await all<UsuarioConVehiculos & { vehiculo_placa: string | null; vehiculo_id_usuario: number | null; vehiculo_tipo: string | null }>(`SELECT u.id_usuario, u.identificacion, u.nombre, u.telefono, u.estado_mensualidad,
    v.placa AS vehiculo_placa, v.id_usuario AS vehiculo_id_usuario, v.tipo_vehiculo AS vehiculo_tipo
    FROM usuario u LEFT JOIN vehiculo v ON v.id_usuario = u.id_usuario ORDER BY u.nombre, v.placa`);
  return agruparUsuarios(rows);
}

export async function findByIdWithVehiculos(id_usuario: number): Promise<UsuarioConVehiculos | undefined> {
  const rows = await all<UsuarioConVehiculos & { vehiculo_placa: string | null; vehiculo_id_usuario: number | null; vehiculo_tipo: string | null }>(`SELECT u.id_usuario, u.identificacion, u.nombre, u.telefono, u.estado_mensualidad,
    v.placa AS vehiculo_placa, v.id_usuario AS vehiculo_id_usuario, v.tipo_vehiculo AS vehiculo_tipo
    FROM usuario u LEFT JOIN vehiculo v ON v.id_usuario = u.id_usuario WHERE u.id_usuario = ?`, [id_usuario]);
  return agruparUsuarios(rows)[0];
}

export async function create(identificacion: string, nombre: string, telefono: string, estado_mensualidad: EstadoMensualidad, placa?: string, tipo_vehiculo?: string): Promise<UsuarioConVehiculos> {
  await run('BEGIN TRANSACTION');
  try {
  const result = await run(
    'INSERT INTO usuario (identificacion, nombre, telefono, estado_mensualidad) VALUES (?, ?, ?, ?)',
    [identificacion, nombre, telefono, estado_mensualidad]
  );
  if (placa) {
    await run('INSERT INTO vehiculo (placa, id_usuario, tipo_vehiculo) VALUES (?, ?, ?)', [placa, result.lastID, tipo_vehiculo || 'AUTOMOVIL']);
  }
  await run('COMMIT');
  const user = await findByIdWithVehiculos(result.lastID);
  if (!user) throw new Error('No fue posible recuperar el usuario creado');
  return user;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function updateProfile(id_usuario: number, identificacion: string, nombre: string, telefono: string, estado_mensualidad: EstadoMensualidad, placa?: string, tipo_vehiculo?: string): Promise<UsuarioConVehiculos> {
  await run('BEGIN TRANSACTION');
  try {
    await run('UPDATE usuario SET identificacion = ?, nombre = ?, telefono = ?, estado_mensualidad = ? WHERE id_usuario = ?', [identificacion, nombre, telefono, estado_mensualidad, id_usuario]);
    const vehicle = await get<Vehiculo>('SELECT placa, id_usuario, tipo_vehiculo FROM vehiculo WHERE id_usuario = ? ORDER BY placa LIMIT 1', [id_usuario]);
    if (placa && vehicle) {
      await run('UPDATE vehiculo SET placa = ?, tipo_vehiculo = ? WHERE placa = ?', [placa, tipo_vehiculo || 'AUTOMOVIL', vehicle.placa]);
    } else if (placa) {
      await run('INSERT INTO vehiculo (placa, id_usuario, tipo_vehiculo) VALUES (?, ?, ?)', [placa, id_usuario, tipo_vehiculo || 'AUTOMOVIL']);
    }
    await run('COMMIT');
    const user = await findByIdWithVehiculos(id_usuario);
    if (!user) throw new Error('No fue posible recuperar el usuario actualizado');
    return user;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function updateMensualidad(id_usuario: number, estado_mensualidad: string): Promise<Usuario> {
  await run(
    'UPDATE usuario SET estado_mensualidad = ? WHERE id_usuario = ?',
    [estado_mensualidad, id_usuario]
  );
  const user = await get<Usuario>(
    'SELECT id_usuario, identificacion, nombre, telefono, estado_mensualidad FROM usuario WHERE id_usuario = ?',
    [id_usuario]
  );
  if (!user) {
    throw new Error('No fue posible recuperar el usuario actualizado');
  }
  return user;
}

function agruparUsuarios(rows: Array<UsuarioConVehiculos & { vehiculo_placa: string | null; vehiculo_id_usuario: number | null; vehiculo_tipo: string | null }>): UsuarioConVehiculos[] {
  const users = new Map<number, UsuarioConVehiculos>();
  for (const row of rows) {
    let user = users.get(row.id_usuario);
    if (!user) {
      user = { id_usuario: row.id_usuario, identificacion: row.identificacion, nombre: row.nombre, telefono: row.telefono, estado_mensualidad: row.estado_mensualidad, vehiculos: [] };
      users.set(row.id_usuario, user);
    }
    if (row.vehiculo_placa && row.vehiculo_id_usuario !== null && row.vehiculo_tipo) {
      user.vehiculos.push({ placa: row.vehiculo_placa, id_usuario: row.vehiculo_id_usuario, tipo_vehiculo: row.vehiculo_tipo });
    }
  }
  return Array.from(users.values());
}