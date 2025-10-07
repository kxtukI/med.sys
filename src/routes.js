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
import authorizationMiddleware, { checkOwnershipOrAdmin } from './app/middlewares/authorizationMiddleware.js';
import { checkMedicalRecordOwnership, checkAppointmentOwnership } from './app/middlewares/ownershipMiddleware.js';
import SessionsController from './app/controllers/SessionsController.js';

const routes = new Router();

routes.get('/users', paginationMiddleware, UsersController.index);

routes.post('/patients', PatientsControllers.create);
routes.post('/sessions', SessionsController.login);
routes.post('/logout', SessionsController.logout);
routes.post('/password/request_recovery', UsersController.requestPasswordRecovery);
routes.post('/password/reset', UsersController.resetPassword);
routes.post('/patients/request_password_recovery', PatientsControllers.requestPasswordRecoveryByCpf);
routes.post('/patients/reset_password', PatientsControllers.resetPassword);

routes.use(authMiddleware);

routes.get('/users/:id', UsersController.show);
routes.put('/users/:id', authorizationMiddleware(['admin']), UsersController.update);
routes.delete('/users/:id', authorizationMiddleware(['admin']), UsersController.delete);

routes.get('/patients', paginationMiddleware, PatientsControllers.index);
routes.get('/patients/:id', PatientsControllers.show);
routes.put('/patients/:id', PatientsControllers.update);
routes.delete('/patients/:id', PatientsControllers.delete);
routes.get('/patients/:id/medical_history', PatientsControllers.getMedicalHistory);

routes.get('/professionals', paginationMiddleware, ProfessionalsController.index);
routes.get('/professionals/:id', ProfessionalsController.show);
routes.post('/professionals', authorizationMiddleware(['admin']), ProfessionalsController.create);
routes.put('/professionals/:id', authorizationMiddleware(['professional', 'admin']), checkOwnershipOrAdmin, ProfessionalsController.update);
routes.delete('/professionals/:id', authorizationMiddleware(['admin']), ProfessionalsController.delete);

routes.get('/health_units', paginationMiddleware, HealthUnitsController.index);
routes.get('/health_units/:id', HealthUnitsController.show);
routes.post('/health_units', authorizationMiddleware(['admin']), HealthUnitsController.create);
routes.put('/health_units/:id', authorizationMiddleware(['admin']), HealthUnitsController.update);
routes.delete('/health_units/:id', authorizationMiddleware(['admin']), HealthUnitsController.delete);

routes.get('/medications', paginationMiddleware, MedicationsController.index);
routes.get('/medications/:id', MedicationsController.show);
routes.post('/medications', authorizationMiddleware(['admin']), MedicationsController.create);
routes.put('/medications/:id', authorizationMiddleware(['admin']), MedicationsController.update);
routes.delete('/medications/:id', authorizationMiddleware(['admin']), MedicationsController.delete);

routes.get('/medication_inventory', paginationMiddleware, MedicationInventoryController.index);
routes.get('/medication_inventory/:id', MedicationInventoryController.show);
routes.post('/medication_inventory', authorizationMiddleware(['professional']), MedicationInventoryController.create);
routes.put('/medication_inventory/:id', authorizationMiddleware(['professional']), MedicationInventoryController.update);
routes.delete('/medication_inventory/:id', authorizationMiddleware(['professional']), MedicationInventoryController.delete);

routes.get('/medical_records', paginationMiddleware, MedicalRecordsController.index);
routes.get('/medical_records/patient/:patient_id', paginationMiddleware, MedicalRecordsController.findByPatient);
routes.get('/medical_records/:id', MedicalRecordsController.show);
routes.post('/medical_records', authorizationMiddleware(['professional']), MedicalRecordsController.create);
routes.put('/medical_records/:id', authorizationMiddleware(['professional']), checkMedicalRecordOwnership, MedicalRecordsController.update);
routes.delete('/medical_records/:id', authorizationMiddleware(['professional']), checkMedicalRecordOwnership, MedicalRecordsController.delete);

routes.get('/appointments', paginationMiddleware, AppointmentsController.index);
routes.get('/appointments/:id', AppointmentsController.show);
routes.post('/appointments', authorizationMiddleware(['professional']), AppointmentsController.create);
routes.put('/appointments/:id', authorizationMiddleware(['professional']), checkAppointmentOwnership, AppointmentsController.update);
routes.delete('/appointments/:id', authorizationMiddleware(['professional']), checkAppointmentOwnership, AppointmentsController.delete);

export default routes;
