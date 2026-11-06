import express from 'express';
import accesoRoutes from './routes/accesoRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import celdaRoutes from './routes/celdaRoutes';
import { initializeDatabase } from './config/database';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use('/api/v1/acceso', accesoRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/celdas', celdaRoutes);

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor Autos Colombia ejecutandose en http://localhost:${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('No fue posible inicializar la base de datos', error);
    process.exit(1);
  });