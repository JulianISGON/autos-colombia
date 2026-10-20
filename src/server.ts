import express from 'express';
import accesoRoutes from './routes/accesoRoutes';
import { initializeDatabase } from './config/database';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use('/api/v1/acceso', accesoRoutes);

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