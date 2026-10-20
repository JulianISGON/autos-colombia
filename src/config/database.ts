import path from 'node:path';
import sqlite3 from 'sqlite3';

const databasePath = path.resolve(process.cwd(), 'autos-colombia.sqlite');
export const database = new sqlite3.Database(databasePath);

function run(sql: string, parameters: unknown[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    database.run(sql, parameters, function (error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(this);
    });
  });
}

function get<T>(sql: string, parameters: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    database.get(sql, parameters, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row as T | undefined);
    });
  });
}

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    database.serialize(async () => {
      try {
        await run('PRAGMA foreign_keys = ON');
        await run(`CREATE TABLE IF NOT EXISTS usuario (
          id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
          identificacion TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          telefono TEXT NOT NULL,
          estado_mensualidad TEXT NOT NULL
        )`);
        await run(`CREATE TABLE IF NOT EXISTS vehiculo (
          placa TEXT PRIMARY KEY,
          id_usuario INTEGER NOT NULL,
          tipo_vehiculo TEXT NOT NULL,
          FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        )`);
        await run(`CREATE TABLE IF NOT EXISTS celda (
          id_celda INTEGER PRIMARY KEY AUTOINCREMENT,
          numero_celda TEXT UNIQUE NOT NULL,
          estado TEXT NOT NULL
        )`);
        await run(`CREATE TABLE IF NOT EXISTS registro_acceso (
          id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
          placa TEXT NOT NULL,
          id_celda INTEGER NOT NULL,
          fecha_ingreso TEXT NOT NULL,
          fecha_salida TEXT,
          estado_registro TEXT NOT NULL,
          FOREIGN KEY (placa) REFERENCES vehiculo(placa),
          FOREIGN KEY (id_celda) REFERENCES celda(id_celda)
        )`);
        await run(`CREATE TABLE IF NOT EXISTS novedad (
          id_novedad INTEGER PRIMARY KEY AUTOINCREMENT,
          id_registro INTEGER NOT NULL,
          descripcion TEXT NOT NULL,
          fecha_registro TEXT NOT NULL,
          FOREIGN KEY (id_registro) REFERENCES registro_acceso(id_registro)
        )`);

        const userCount = await get<{ count: number }>('SELECT COUNT(*) AS count FROM usuario');
        const cellCount = await get<{ count: number }>('SELECT COUNT(*) AS count FROM celda');
        if ((userCount?.count ?? 0) === 0 && (cellCount?.count ?? 0) === 0) {
          await run('BEGIN TRANSACTION');
          await run('INSERT INTO usuario (identificacion, nombre, telefono, estado_mensualidad) VALUES (?, ?, ?, ?)', ['1001', 'Carlos Pérez', '3001234567', 'ACTIVA']);
          await run('INSERT INTO usuario (identificacion, nombre, telefono, estado_mensualidad) VALUES (?, ?, ?, ?)', ['1002', 'Ana Gómez', '3109876543', 'VENCIDA']);
          await run('INSERT INTO vehiculo (placa, id_usuario, tipo_vehiculo) VALUES (?, (SELECT id_usuario FROM usuario WHERE identificacion = ?), ?)', ['ABC123', '1001', 'AUTOMOVIL']);
          await run('INSERT INTO vehiculo (placa, id_usuario, tipo_vehiculo) VALUES (?, (SELECT id_usuario FROM usuario WHERE identificacion = ?), ?)', ['XYZ987', '1002', 'AUTOMOVIL']);
          for (const cell of ['A-01', 'A-02', 'A-03', 'B-01', 'B-02']) {
            await run('INSERT INTO celda (numero_celda, estado) VALUES (?, ?)', [cell, 'DISPONIBLE']);
          }
          await run('COMMIT');
        }
        resolve();
      } catch (error) {
        try {
          await run('ROLLBACK');
        } catch {
          // The transaction may not have started yet.
        }
        reject(error);
      }
    });
  });
}