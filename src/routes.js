import paginationMiddleware from './app/middlewares/paginationMiddleware.js';
import { Router } from 'express';

import PatientsControllers from './app/controllers/PatientsControllers';

const routes = new Router();

routes.get('/patients', paginationMiddleware, PatientsControllers.index);
routes.post('/patients', PatientsControllers.create);

export default routes;
