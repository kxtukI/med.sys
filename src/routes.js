import paginationMiddleware from './app/middlewares/paginationMiddleware.js';
import { Router } from 'express';

import UsersController from './app/controllers/UsersController.js';
import PatientsControllers from './app/controllers/PatientsControllers.js';
import ProfessionalsController from './app/controllers/ProfessionalsController.js';
import HealthUnitsController from './app/controllers/HealthUnitsController.js';
import MedicationsController from './app/controllers/MedicationsController.js';
import MedicationInventoryController from './app/controllers/MedicationInventoryController.js';
import MedicalRecordsController from './app/controllers/MedicalRecordsController.js';
import AppointmentsController from './app/controllers/AppointmentsController.js';

const routes = new Router();

routes.get('/users', paginationMiddleware, UsersController.index);

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

routes.get('/medication_inventory', paginationMiddleware, MedicationInventoryController.index);
routes.get('/medication_inventory/:id', MedicationInventoryController.show);
routes.post('/medication_inventory', MedicationInventoryController.create);
routes.put('/medication_inventory/:id', MedicationInventoryController.update);
routes.delete('/medication_inventory/:id', MedicationInventoryController.delete);

routes.get('/medical_records', paginationMiddleware, MedicalRecordsController.index);
routes.get('/medical_records/:id', MedicalRecordsController.show);
routes.post('/medical_records', MedicalRecordsController.create);
routes.put('/medical_records/:id', MedicalRecordsController.update);
routes.delete('/medical_records/:id', MedicalRecordsController.delete);

routes.get('/appointments', paginationMiddleware, AppointmentsController.index);
routes.get('/appointments/:id', AppointmentsController.show);
routes.post('/appointments', AppointmentsController.create);
routes.put('/appointments/:id', AppointmentsController.update);
routes.delete('/appointments/:id', AppointmentsController.delete);

export default routes;
