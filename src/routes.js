import paginationMiddleware from './app/middlewares/paginationMiddleware.js';
import { Router } from 'express';

import PatientsControllers from './app/controllers/PatientsControllers';

const routes = new Router();

routes.get('/patients', paginationMiddleware, PatientsControllers.index);
routes.get('/patients/:id', PatientsControllers.show);
routes.post('/patients', PatientsControllers.create);
routes.put('/patients/:id', PatientsControllers.update);
routes.delete('/patients/:id', PatientsControllers.delete);

export default routes;
