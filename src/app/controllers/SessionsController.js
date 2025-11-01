import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth.js';
import User from '../models/Users.js';
import Patient from '../models/Patients.js';

const tokenBlacklist = new Set();

class SessionsController {
  async login(req, res) {
    const { cpf, sus_number, email, password } = req.body;

    if (!cpf && !sus_number && !email) {
      return res.status(400).json({ error: 'CPF, SUS ou email é obrigatório' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const patientWhere = {};
    if (cpf) patientWhere.cpf = cpf.replace(/\D/g, '');
    if (sus_number) patientWhere.sus_number = sus_number.replace(/\D/g, '');

    const userWhere = {};
    if (email) userWhere.email = email.toLowerCase();

    let user;
    
    if (Object.keys(patientWhere).length > 0) {
      const patient = await Patient.findOne({
        where: patientWhere,
        include: [{ model: User, as: 'users', required: true }],
      });
      user = patient?.users;
    } else {
      user = await User.findOne({ where: userWhere });
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const token = jwt.sign({ id: user.id }, authConfig.secret, {
      expiresIn: authConfig.expiresIn,
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
      },
      token,
    });
  }

  async logout(req, res) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [, token] = authHeader.split(' ');
    tokenBlacklist.add(token);
    
    return res.json({ message: 'Logout realizado com sucesso' });
  }
}

export default new SessionsController();
export { tokenBlacklist };
