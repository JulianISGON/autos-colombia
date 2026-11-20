import { Router } from 'express';
import { crearPago, listarPagos, listarResumen } from '../controllers/pagoController';

const pagoRoutes = Router();

pagoRoutes.post('/', crearPago);
pagoRoutes.get('/', listarPagos);
pagoRoutes.get('/resumen', listarResumen);

export default pagoRoutes;
