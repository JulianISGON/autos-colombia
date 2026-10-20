import { Router } from 'express';
import { celdas, entrada, presentes, salida } from '../controllers/accesoController';

const accesoRoutes = Router();

accesoRoutes.post('/entrada', entrada);
accesoRoutes.post('/salida', salida);
accesoRoutes.get('/presentes', presentes);
accesoRoutes.get('/celdas', celdas);

export default accesoRoutes;