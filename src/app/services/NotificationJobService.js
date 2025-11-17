import Notifications from '../models/Notifications.js';
import SmsService from './SmsService.js';
import User from '../models/Users.js';
import Patient from '../models/Patients.js'; 
import { Op } from 'sequelize';

export async function processPendingNotifications() {
  const now = new Date();
  const notifications = await Notifications.findAll({
    where: { status: 'pending', scheduled_for: { [Op.lte]: now } }
  });

  for (const n of notifications) {
    let user = null;
    if (n.target_type === 'patient') {
      const patient = await Patient.findByPk(n.target_id, {
        attributes: ['user_id'], 
      });
      if (patient) {
        user = await User.findByPk(patient.user_id);
      }
    }

    if (!user?.phone) {
      await n.update({ status: 'failed', error: 'Telefone do usuário não encontrado' });
      continue;
    }
    await SmsService.sendSms({
      to: user.phone,
      message: n.message,
      notificationData: { ...n.dataValues, id: n.id }
    });
  }
}
