import { database } from '../config/database';
import { MetodoPago, PagoConUsuario, ResumenCuentaUsuario, Usuario } from '../models/types';

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

export async function findUsuarioByIdentificacion(identificacion: string): Promise<Usuario | undefined> {
  return get<Usuario>(
    'SELECT id_usuario, identificacion, nombre, telefono, estado_mensualidad FROM usuario WHERE identificacion = ?',
    [identificacion]
  );
}

export async function registrarPago(
  idUsuario: number,
  monto: number,
  metodoPago: MetodoPago
): Promise<PagoConUsuario> {
  await run('BEGIN TRANSACTION');
  try {
    const ultimo = await get<{ id_pago: number }>('SELECT id_pago FROM pago ORDER BY id_pago DESC LIMIT 1');
    const consecutivo = (ultimo?.id_pago ?? 0) + 1;
    const codigoComprobante = `REC-${String(consecutivo).padStart(4, '0')}`;
    const fechaPago = new Date().toISOString();

    await run(
      `INSERT INTO pago (codigo_comprobante, id_usuario, monto, metodo_pago, estado_pago, fecha_pago)
       VALUES (?, ?, ?, ?, 'PAGADO', ?)`,
      [codigoComprobante, idUsuario, monto, metodoPago, fechaPago]
    );
    await run(
      "UPDATE usuario SET estado_mensualidad = 'ACTIVA' WHERE id_usuario = ?",
      [idUsuario]
    );
    await run('COMMIT');

    const pago = await get<PagoConUsuario>(
      `SELECT p.id_pago, p.codigo_comprobante, p.id_usuario, p.monto, p.metodo_pago,
              p.estado_pago, p.fecha_pago, u.identificacion, u.nombre
       FROM pago p JOIN usuario u ON u.id_usuario = p.id_usuario
       WHERE p.codigo_comprobante = ?`,
      [codigoComprobante]
    );
    if (!pago) throw new Error('No fue posible recuperar el pago registrado');
    return pago;
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function findPagos(identificacion?: string): Promise<PagoConUsuario[]> {
  const where = identificacion ? 'WHERE u.identificacion = ?' : '';
  const parameters = identificacion ? [identificacion] : [];
  return all<PagoConUsuario>(
    `SELECT p.id_pago, p.codigo_comprobante, p.id_usuario, p.monto, p.metodo_pago,
            p.estado_pago, p.fecha_pago, u.identificacion, u.nombre
     FROM pago p JOIN usuario u ON u.id_usuario = p.id_usuario
     ${where}
     ORDER BY p.fecha_pago DESC, p.id_pago DESC`,
    parameters
  );
}

export async function findResumen(): Promise<ResumenCuentaUsuario[]> {
  const usuarios = await all<Omit<ResumenCuentaUsuario, 'estado_cuenta' | 'ultimo_pago'> & { estado_mensualidad: 'ACTIVA' | 'VENCIDA' }>(
    'SELECT id_usuario, identificacion, nombre, estado_mensualidad FROM usuario ORDER BY nombre'
  );
  const resumen: ResumenCuentaUsuario[] = [];
  for (const usuario of usuarios) {
    const ultimoPago = await get<PagoConUsuario>(
      `SELECT p.id_pago, p.codigo_comprobante, p.id_usuario, p.monto, p.metodo_pago,
              p.estado_pago, p.fecha_pago, u.identificacion, u.nombre
       FROM pago p JOIN usuario u ON u.id_usuario = p.id_usuario
       WHERE p.id_usuario = ?
       ORDER BY p.fecha_pago DESC, p.id_pago DESC LIMIT 1`,
      [usuario.id_usuario]
    );
    resumen.push({
      ...usuario,
      estado_cuenta: usuario.estado_mensualidad === 'ACTIVA' ? 'AL DIA' : 'EN MORA',
      ultimo_pago: ultimoPago ?? null
    });
  }
  return resumen;
}
