import Appointment from '../models/Appointments.js';
import Notifications from '../models/Notifications.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

export async function processLateAppointments() {
  const now = new Date();
  const GRACE_MIN = 15;
  const lateAppointments = await Appointment.findAll({
    where: {
      status: 'scheduled',
      date_time: { [Op.lte]: new Date(now.getTime() - GRACE_MIN * 60 * 1000) }
    }
  });

  for (const appt of lateAppointments) {
    const alreadyNotified = await Notifications.findOne({
      where: { type: 'appointment_late', appointment_id: appt.id }
    });
    if (!alreadyNotified) {
      const token = crypto.randomBytes(32).toString('hex');
      const cancelUrl = `https://med-sys-3z00.onrender.com/cancel-by-token/${appt.id}?token=${token}`;
      await Notifications.create({
        target_type: 'patient',
        target_id: appt.patient_id,
        appointment_id: appt.id,
        type: 'appointment_late',
        message: `Você está atrasado para a consulta. Deseja cancelar?`,
        channel: 'sms',
        status: 'pending',
        scheduled_for: now,
        token
      });
    }
  }
}
