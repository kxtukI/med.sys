import User from '../models/Users.js';

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

    return next();
  };
};

export default authorizationMiddleware;
