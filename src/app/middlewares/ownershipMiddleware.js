import MedicalRecord from '../models/MedicalRecords.js';
import Appointments from '../models/Appointments.js';
import Patient from '../models/Patients.js';

export const checkMedicalRecordOwnership = async (req, res, next) => {
  const userId = req.userId;
  const recordId = req.params.id;

  if (!userId || !recordId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const record = await MedicalRecord.findByPk(recordId);
  if (!record) {
    return res.status(404).json({ error: 'Prontuário não encontrado' });
  }

  const Professional = (await import('../models/Professionals')); 
  const prof = await Professional.default.findOne({ where: { user_id: userId } });
  if (!prof) {
    return res.status(403).json({ error: 'Não é um profissional' });
  }

  if (record.professional_id !== prof.id) {
    return res.status(403).json({ error: 'Você só pode editar seus próprios prontuários' });
  }

  return next();
};

export const checkAppointmentOwnership = async (req, res, next) => {
  const userId = req.userId;
  const appointmentId = req.params.id;

  if (!userId || !appointmentId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const appointment = await Appointments.findByPk(appointmentId);
  if (!appointment) {
    return res.status(404).json({ error: 'Agendamento não encontrado' });
  }

  const Professional = (await import('../models/Professionals'));
  const prof = await Professional.default.findOne({ where: { user_id: userId } });
  if (!prof) {
    return res.status(403).json({ error: 'Não é um profissional' });
  }

  if (appointment.professional_id !== prof.id) {
    return res.status(403).json({ error: 'Você só pode editar seus próprios agendamentos' });
  }

  return next();
};

export const checkPatientOwnership = async (req, res, next) => {
  const userId = req.userId;
  const patientId = req.params.id;
  const currentUser = req.currentUser;

  if (!userId || !patientId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (currentUser && currentUser.user_type === 'admin') {
    return next();
  }

  if (currentUser && currentUser.user_type === 'patient') {
    const patient = await Patient.findOne({ where: { user_id: userId } });
    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }
    if (String(patient.id) !== String(patientId)) {
      return res.status(403).json({ error: 'Você só pode editar seus próprios dados' });
    }
    return next();
  }

  return res.status(403).json({ error: 'Acesso negado' });
};
