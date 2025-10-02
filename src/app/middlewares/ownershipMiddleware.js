import MedicalRecord from '../models/MedicalRecords.js';
import Appointments from '../models/Appointments.js';

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
