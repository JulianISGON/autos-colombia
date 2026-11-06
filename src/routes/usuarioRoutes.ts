import { Router } from 'express';
import { crearUsuario, listarUsuarios, actualizarMensualidad, actualizarUsuario } from '../controllers/usuarioController';

const usuarioRoutes = Router();

usuarioRoutes.post('/', crearUsuario);
usuarioRoutes.get('/', listarUsuarios);
usuarioRoutes.put('/:id/mensualidad', actualizarMensualidad);
usuarioRoutes.put('/:id', actualizarUsuario);

export default usuarioRoutes;