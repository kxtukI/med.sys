import paginationMiddleware from './app/middlewares/paginationMiddleware.js';
import { Router } from 'express';
import { upload, uploadToCloudinary } from './app/middlewares/upload.js';

import UsersController from './app/controllers/UsersController.js';
import PatientsControllers from './app/controllers/PatientsControllers.js';
import ProfessionalsController from './app/controllers/ProfessionalsController.js';
import HealthUnitsController from './app/controllers/HealthUnitsController.js';
import MedicationsController from './app/controllers/MedicationsController.js';
import MedicationInventoryController from './app/controllers/MedicationInventoryController.js';
import MedicationReservationsController from './app/controllers/MedicationReservationsController.js';
import MedicalRecordsController from './app/controllers/MedicalRecordsController.js';
import AppointmentsController from './app/controllers/AppointmentsController.js';
import ReferralsController from './app/controllers/ReferralsController.js';
import authMiddleware from './app/middlewares/authMiddleware.js';
import authorizationMiddleware, { checkOwnershipOrAdmin } from './app/middlewares/authorizationMiddleware.js';
import { checkMedicalRecordOwnership, checkAppointmentOwnership } from './app/middlewares/ownershipMiddleware.js';
import checkHealthUnitAccess from './app/middlewares/adminHealthUnitMiddleware.js';
import SessionsController from './app/controllers/SessionsController.js';
import NotificationsController from './app/controllers/NotificationsController.js';

import { processPendingNotifications } from './app/services/NotificationJobService.js';
import { processLateAppointments } from './app/services/LateAppointmentJobService.js';

const routes = new Router();

routes.post('/patients', PatientsControllers.create);
routes.post('/sessions', SessionsController.login);
routes.post('/logout', SessionsController.logout);
routes.post('/password/request_recovery', UsersController.requestPasswordRecovery);
routes.post('/password/reset', UsersController.resetPassword);

routes.use(authMiddleware);

routes.get('/users', authorizationMiddleware(['admin']), paginationMiddleware, UsersController.index);
routes.get('/users/:id', authorizationMiddleware(['admin']), UsersController.show);
routes.put('/users/:id', authorizationMiddleware(['admin']), UsersController.update);
routes.post('/users', authorizationMiddleware(['admin']), UsersController.create);
routes.delete('/users/:id', authorizationMiddleware(['admin']), UsersController.delete);
routes.get('/users/admins/by-health-unit/:health_unit_id', authorizationMiddleware(['admin']), UsersController.listAdminsByHealthUnit);
routes.put('/users/:id/assign-health-unit', authorizationMiddleware(['admin']), UsersController.assignHealthUnit);
routes.put('/users/:id/remove-health-unit', authorizationMiddleware(['admin']), UsersController.removeHealthUnit);

routes.get('/patients', authorizationMiddleware(['professional', 'admin']), paginationMiddleware, PatientsControllers.index);
routes.get('/patients/:id', authorizationMiddleware(['professional', 'admin']), PatientsControllers.show);
routes.put('/patients/:id', authorizationMiddleware(['admin']), PatientsControllers.update);
routes.delete('/patients/:id', authorizationMiddleware(['admin']), PatientsControllers.delete);
routes.get('/patients/:id/medical_history', authorizationMiddleware(['professional', 'admin']), PatientsControllers.getMedicalHistory);

routes.get('/professionals', paginationMiddleware, ProfessionalsController.index);
routes.get('/professionals/:id', ProfessionalsController.show);
routes.post('/professionals', authorizationMiddleware(['admin']), upload.single('photo'), uploadToCloudinary, ProfessionalsController.create);
routes.put('/professionals/:id', authorizationMiddleware(['professional', 'admin']), checkOwnershipOrAdmin, upload.single('photo'), uploadToCloudinary, ProfessionalsController.update);
routes.delete('/professionals/:id', authorizationMiddleware(['admin']), ProfessionalsController.delete);

routes.get('/health_units', paginationMiddleware, HealthUnitsController.index);
routes.get('/health_units/:id', HealthUnitsController.show);
routes.post('/health_units', authorizationMiddleware(['admin']), checkHealthUnitAccess, upload.single('photo'), uploadToCloudinary, HealthUnitsController.create);
routes.put('/health_units/:id', authorizationMiddleware(['admin']), checkHealthUnitAccess, upload.single('photo'), uploadToCloudinary, HealthUnitsController.update);
routes.delete('/health_units/:id', authorizationMiddleware(['admin']), checkHealthUnitAccess, HealthUnitsController.delete);

routes.get('/medications', paginationMiddleware, MedicationsController.index);
routes.get('/medications/:id', MedicationsController.show);
routes.post('/medications', authorizationMiddleware(['admin']), checkHealthUnitAccess, upload.single('photo'), uploadToCloudinary, MedicationsController.create);
routes.put('/medications/:id', authorizationMiddleware(['admin']), checkHealthUnitAccess, upload.single('photo'), uploadToCloudinary, MedicationsController.update);
routes.delete('/medications/:id', authorizationMiddleware(['admin']), checkHealthUnitAccess, MedicationsController.delete);

routes.get('/medication_inventory', paginationMiddleware, MedicationInventoryController.index);
routes.get('/medication_inventory/:id', MedicationInventoryController.show);
routes.post('/medication_inventory', authorizationMiddleware(['professional', 'admin']), checkHealthUnitAccess, MedicationInventoryController.create);
routes.put('/medication_inventory/:id', authorizationMiddleware(['professional', 'admin']), checkHealthUnitAccess, MedicationInventoryController.update);
routes.delete('/medication_inventory/:id', authorizationMiddleware(['admin']), checkHealthUnitAccess, MedicationInventoryController.delete);

routes.get('/medication_reservations', authorizationMiddleware(['patient', 'professional', 'admin']), paginationMiddleware, MedicationReservationsController.index);
routes.get('/medication_reservations/:id', authorizationMiddleware(['patient', 'professional', 'admin']), MedicationReservationsController.show);
routes.post('/medication_reservations', authorizationMiddleware(['patient', 'professional', 'admin']), checkHealthUnitAccess, MedicationReservationsController.create);
routes.put('/medication_reservations/:id', authorizationMiddleware(['patient', 'professional', 'admin']), checkHealthUnitAccess, MedicationReservationsController.update);
routes.delete('/medication_reservations/:id', authorizationMiddleware(['patient', 'professional', 'admin']), checkHealthUnitAccess, MedicationReservationsController.delete);

routes.get('/medical_records', paginationMiddleware, MedicalRecordsController.index);
routes.get('/medical_records/patient/:patient_id', paginationMiddleware, MedicalRecordsController.findByPatient);
routes.get('/medical_records/:id', MedicalRecordsController.show);
routes.post('/medical_records', authorizationMiddleware(['professional', 'admin']), MedicalRecordsController.create);
routes.put('/medical_records/:id', authorizationMiddleware(['professional', 'admin']), checkMedicalRecordOwnership, MedicalRecordsController.update);
routes.delete('/medical_records/:id', authorizationMiddleware(['admin']), MedicalRecordsController.delete);

routes.get('/appointments', paginationMiddleware, AppointmentsController.index);
routes.get('/appointments/calendar', authorizationMiddleware(['patient', 'professional', 'admin']), AppointmentsController.calendar);
routes.get('/appointments/:id', authorizationMiddleware(['patient', 'professional', 'admin']), AppointmentsController.show);
routes.post('/appointments', authorizationMiddleware(['patient', 'professional', 'admin']), AppointmentsController.create);
routes.put('/appointments/:id', authorizationMiddleware(['patient', 'professional', 'admin']), checkAppointmentOwnership, AppointmentsController.update);
routes.delete('/appointments/:id', authorizationMiddleware(['patient', 'professional', 'admin']), AppointmentsController.delete);

routes.get('/referrals', authorizationMiddleware(['professional', 'admin']), ReferralsController.index);
routes.get('/referrals/:id', authorizationMiddleware(['professional', 'admin']), ReferralsController.show);
routes.post('/referrals', authorizationMiddleware(['professional', 'admin']), ReferralsController.create);
routes.put('/referrals/:id', authorizationMiddleware(['professional', 'admin']), ReferralsController.update);

routes.get('/notifications', NotificationsController.index);
routes.post('/notifications/:id/resend', NotificationsController.resend);
//routes.post('/appointments/:id/cancel-by-token', NotificationsController.cancelByToken);

routes.post('/jobs/run-pending-notifications', async (req, res) => {
    try {
        await processPendingNotifications();
        res.status(200).json({ message: 'Job de notificações pendentes executado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao executar o job.', details: error.message });
    }
});

routes.post('/jobs/run-late-appointments', async (req, res) => {
    try {
        await processLateAppointments();
        res.status(200).json({ message: 'Job de agendamentos atrasados executado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao executar o job.', details: error.message });
    }
});

export default routes;
