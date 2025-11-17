import User from '../models/Users.js';
import Professionals from '../models/Professionals.js';
import Appointments from '../models/Appointments.js';

const authorizationMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    req.currentUser = user;
    return next();
  };
};

export const checkOwnershipOrAdmin = async (req, res, next) => {
  const { currentUser, userId } = req;
  const resourceId = req.params.id || req.params.professional_id || req.params.appointment_id;

  if (currentUser && (currentUser.user_type === 'admin')) {
    return next();
  }

  const resource = req.route?.path?.includes('professional') ? 'professional' : 'appointment';

  if (resource === 'professional') {
    const prof = await Professionals.findOne({ where: { user_id: userId } });
    if (!prof || String(prof.id) !== String(resourceId)) {
      return res.status(403).json({ error: 'Você não pode acessar este recurso' });
    }
  } else if (resource === 'appointment') {
    const apt = await Appointments.findByPk(resourceId);
    if (!apt) return res.status(404).json({ error: 'Agendamento não encontrado' });
    const profUser = await Professionals.findOne({ where: { user_id: userId } });
    if (!profUser || String(profUser.id) !== String(apt.professional_id)) {
      return res.status(403).json({ error: 'Você não pode editar este agendamento' });
    }
  }

  return next();
};

export default authorizationMiddleware;