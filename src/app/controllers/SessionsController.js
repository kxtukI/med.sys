import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth.js';

import User from '../models/Users.js';
import Patient from '../models/Patients.js';

class SessionsController {
  async login(req, res) {
    const { cpf, sus_number, email, password } = req.body;

    if (!cpf && !sus_number && !email) {
      return res.status(400).json({ error: 'CPF, SUS ou email é obrigatório' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const Patientwhere = {};
    if (cpf) Patientwhere.cpf = cpf.replace(/\D/g, '');
    if (sus_number) Patientwhere.sus_number = sus_number.replace(/\D/g, '');

    const Userwhere = {};
    if (email) Userwhere.email = email.toLowerCase();

    let data;
    if (Object.keys(Patientwhere).length > 0) {
      const patient = await Patient.findOne({
        where: Patientwhere,
        include: [
          {
            model: User,
            as: 'users',
            required: true,
          },
        ],
      });

      if (patient) {
        data = patient.users;
      }
    } else {
      data = await User.findOne({ where: Userwhere });
    }

    if (!data) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!(await data.checkPassword(password))) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    return res.json({   
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        user_type: data.user_type,
      },
      token: jwt.sign({ id: data.id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionsController();
