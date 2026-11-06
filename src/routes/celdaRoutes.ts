import { Router } from 'express';
import { crearCelda, listarCeldas, actualizarEstadoCelda } from '../controllers/celdaController';

const celdaRoutes = Router();

celdaRoutes.post('/', crearCelda);
celdaRoutes.get('/', listarCeldas);
celdaRoutes.put('/:id/estado', actualizarEstadoCelda);

export default celdaRoutes;