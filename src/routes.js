import paginationMiddleware from './app/middlewares/paginationMiddleware.js';
import { Router } from 'express';

import PatientsControllers from './app/controllers/PatientsControllers.js';
import ProfessionalsController from './app/controllers/ProfessionalsController.js';
import HealthUnitsController from './app/controllers/HealthUnitsController.js';
import MedicationsController from './app/controllers/MedicationsController.js';
import MedicationInventoryController from './app/controllers/MedicationInventoryController.js';

const routes = new Router();

routes.get('/patients', paginationMiddleware, PatientsControllers.index);
routes.get('/patients/:id', PatientsControllers.show);
routes.post('/patients', PatientsControllers.create);
routes.put('/patients/:id', PatientsControllers.update);
routes.delete('/patients/:id', PatientsControllers.delete);

routes.get('/professionals', paginationMiddleware, ProfessionalsController.index);
routes.get('/professionals/:id', ProfessionalsController.show);
routes.post('/professionals', ProfessionalsController.create);
routes.put('/professionals/:id', ProfessionalsController.update);
routes.delete('/professionals/:id', ProfessionalsController.delete);

routes.get('/health_units', paginationMiddleware, HealthUnitsController.index);
routes.get('/health_units/:id', HealthUnitsController.show);
routes.post('/health_units', HealthUnitsController.create);
routes.put('/health_units/:id', HealthUnitsController.update);
routes.delete('/health_units/:id', HealthUnitsController.delete);

routes.get('/medications', paginationMiddleware, MedicationsController.index);
routes.get('/medications/:id', MedicationsController.show);
routes.post('/medications', MedicationsController.create);
routes.put('/medications/:id', MedicationsController.update);
routes.delete('/medications/:id', MedicationsController.delete);

routes.get('/medication-inventory', paginationMiddleware, MedicationInventoryController.index);
routes.get('/medication-inventory/:id', MedicationInventoryController.show);
routes.post('/medication-inventory', MedicationInventoryController.create);
routes.put('/medication-inventory/:id', MedicationInventoryController.update);
routes.delete('/medication-inventory/:id', MedicationInventoryController.delete);

export default routes;
