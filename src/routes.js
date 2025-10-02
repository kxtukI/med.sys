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
import authMiddleware from './app/middlewares/authMiddleware.js';
import authorizationMiddleware from './app/middlewares/authorizationMiddleware.js';

const routes = new Router();

routes.get('/users', paginationMiddleware, UsersController.index);

// aplica auth global nas rotas abaixo
routes.use(authMiddleware);

// Patients (apenas listagem exige auth aqui por enquanto)
routes.get('/patients', paginationMiddleware, PatientsControllers.index);
routes.get('/patients/:id', PatientsControllers.show);
routes.post('/patients', PatientsControllers.create);
routes.put('/patients/:id', PatientsControllers.update);
routes.delete('/patients/:id', PatientsControllers.delete);

// Professionals
routes.get('/professionals', paginationMiddleware, ProfessionalsController.index);
routes.get('/professionals/:id', ProfessionalsController.show);
routes.post('/professionals', authorizationMiddleware(['professional']), ProfessionalsController.create);
routes.put('/professionals/:id', authorizationMiddleware(['professional']), ProfessionalsController.update);
routes.delete('/professionals/:id', authorizationMiddleware(['professional']), ProfessionalsController.delete);

// Health Units
routes.get('/health_units', paginationMiddleware, HealthUnitsController.index);
routes.get('/health_units/:id', HealthUnitsController.show);
routes.post('/health_units', authorizationMiddleware(['professional']), HealthUnitsController.create);
routes.put('/health_units/:id', authorizationMiddleware(['professional']), HealthUnitsController.update);
routes.delete('/health_units/:id', authorizationMiddleware(['professional']), HealthUnitsController.delete);

// Medications
routes.get('/medications', paginationMiddleware, MedicationsController.index);
routes.get('/medications/:id', MedicationsController.show);
routes.post('/medications', authorizationMiddleware(['professional']), MedicationsController.create);
routes.put('/medications/:id', authorizationMiddleware(['professional']), MedicationsController.update);
routes.delete('/medications/:id', authorizationMiddleware(['professional']), MedicationsController.delete);

// Medication Inventory
routes.get('/medication_inventory', paginationMiddleware, MedicationInventoryController.index);
routes.get('/medication_inventory/:id', MedicationInventoryController.show);
routes.post('/medication_inventory', authorizationMiddleware(['professional']), MedicationInventoryController.create);
routes.put('/medication_inventory/:id', authorizationMiddleware(['professional']), MedicationInventoryController.update);
routes.delete('/medication_inventory/:id', authorizationMiddleware(['professional']), MedicationInventoryController.delete);

// Medical Records
routes.get('/medical_records', paginationMiddleware, MedicalRecordsController.index);
routes.get('/medical_records/patient/:patient_id', paginationMiddleware, MedicalRecordsController.findByPatient);
routes.get('/medical_records/:id', MedicalRecordsController.show);
routes.post('/medical_records', authorizationMiddleware(['professional']), MedicalRecordsController.create);
routes.put('/medical_records/:id', authorizationMiddleware(['professional']), MedicalRecordsController.update);
routes.delete('/medical_records/:id', authorizationMiddleware(['professional']), MedicalRecordsController.delete);

// Appointments
routes.get('/appointments', paginationMiddleware, AppointmentsController.index);
routes.get('/appointments/:id', AppointmentsController.show);
routes.post('/appointments', authorizationMiddleware(['professional']), AppointmentsController.create);
routes.put('/appointments/:id', authorizationMiddleware(['professional']), AppointmentsController.update);
routes.delete('/appointments/:id', authorizationMiddleware(['professional']), AppointmentsController.delete);

export default routes;
