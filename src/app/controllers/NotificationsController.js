import Notifications from '../models/Notifications.js';
import SmsService from '../services/SmsService.js';
import User from '../models/Users.js';
import Appointment from '../models/Appointments.js';

class NotificationsController {
  async index(req, res) {
    const { target_type, target_id, type, status } = req.query;
    const where = {};
    if (target_type) where.target_type = target_type;
    if (target_id) where.target_id = target_id;
    if (type) where.type = type;
    if (status) where.status = status;
    const notifications = await Notifications.findAll({ 
      where, 
      order: [['created_at', 'DESC']],
      include: [{
        model: Appointment,
        as: 'appointment',
        attributes: ['id', 'date_time', 'status']
      }]
    });
    return res.json({ notifications });
  }

  async resend(req, res) {
    const { id } = req.params;
    const notification = await Notifications.findByPk(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    if (notification.channel !== 'sms') {
      return res.status(400).json({ error: 'Tipo de notificação não suportado para reenvio' });
    }
    if (notification.status === 'sent') {
      return res.status(400).json({ error: 'Notificação já enviada com sucesso' });
    }
    let to = null;
    if (notification.target_type === 'patient') {
      const user = await User.findByPk(notification.target_id);
      to = user?.phone;
    }
    if (!to) {
      return res.status(400).json({ error: 'Não foi possível determinar telefone para o reenvio' });
    }
    const result = await SmsService.sendSms({
      to,
      message: notification.message,
      notificationData: {
        ...notification.dataValues,
        id,
      },
    });
    return res.json(result);
  }

  async cancelByToken(req, res) {
    const { id } = req.params;
    const { token } = req.query;
    const notification = await Notifications.findOne({
      where: { appointment_id: id, type: 'appointment_late', token }
    });
    if (!notification) {
      return res.status(400).json({ error: 'Token inválido ou já utilizado.' });
    }
    const appointment = await Appointment.findByPk(id);
    if (!appointment || appointment.status !== 'scheduled') {
      return res.status(400).json({ error: 'Consulta não disponível para cancelar.' });
    }
    appointment.status = 'canceled';
    await appointment.save();
    return res.json({ success: true, message: 'Consulta cancelada com sucesso.' });
  }
}

export default new NotificationsController();
