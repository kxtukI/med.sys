import { Op } from 'sequelize';
import * as Yup from 'yup';

import User from '../models/Users.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import Patient from '../models/Patients.js';
import HealthUnit from '../models/HealthUnits.js';

const recoveryCodes = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const twilioFrom = process.env.TWILIO_FROM;

class UsersController {
  async index(req, res) {
    const { limit, offset } = req.pagination;

    const data = await User.findAndCountAll({
      limit,
      offset,
      order: [['registration_date', 'DESC']],
      attributes: { exclude: ['password_hash'] },
    });

    return res.json({
      data: data.rows,
      total: data.count,
      limit,
      page: offset / limit + 1,
      pages: Math.ceil(data.count / limit),
    });
  }

  async show(req, res) {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
    });
    return res.json({ user });
  }

  async create(req, res) {
    const { name, email, password, user_type, phone, health_unit_id } = req.body;
    const user = await User.create({ name, email, password, user_type, phone, health_unit_id });
    return res.json({ user });
  }

  async update(req, res) {
    const { id } = req.params;
    const { email, name, phone } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Este email já está em uso' });
      }
    }

    try {
      await user.update(req.body);
      return res.json({ user });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    return res.json({ message: 'Usuário deletado com sucesso' });
  }

  async requestPasswordRecovery(req, res) {
    const { email, cpf } = req.body;
    
    if (!email && !cpf) {
      return res.status(400).json({ error: 'Informe email ou CPF' });
    }

    let user;
    
    if (email) {
      user = await User.findOne({ where: { email: email.toLowerCase() } });
    } else if (cpf) {
      const cleanCPF = cpf.replace(/\D/g, '');
      const patient = await Patient.findOne({
        where: { cpf: cleanCPF },
        include: [{ model: User, as: 'users' }],
      });
      user = patient?.users;
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryCodes.set(user.id, { code, expires: Date.now() + 10 * 60 * 1000 });

    try {
      if (email) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Recuperação de senha - Med.Sys',
          text: `Seu código de recuperação é: ${code}. Este código expira em 10 minutos.`,
        });
      } else if (cpf && user.phone) {
        await twilioClient.messages.create({
          body: `Seu código de recuperação é: ${code}. Este código expira em 10 minutos.`,
          from: twilioFrom,
          to: `+55${user.phone}`,
        });
      } else if (cpf && !user.phone) {
        return res.status(400).json({ error: 'Usuário não possui telefone cadastrado' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao enviar código de recuperação' });
    }

    return res.json({ message: 'Código de recuperação enviado com sucesso' });
  }

  async resetPassword(req, res) {
    const { userId, code, newPassword } = req.body;

    if (!code || !newPassword) {
      return res.status(400).json({ error: 'Código e nova senha são obrigatórios' });
    }

    const schema = Yup.object().shape({
      newPassword: Yup.string()
        .required('Senha é obrigatória')
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/, 'Senha deve conter letra e número'),
    });

    if (!(await schema.isValid(req.body))) {
      const errors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }

    let targetUserId = userId;
    
    if (!targetUserId) {
      for (const [id, entry] of recoveryCodes.entries()) {
        if (entry.code === code && entry.expires > Date.now()) {
          targetUserId = id;
          break;
        }
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    const entry = recoveryCodes.get(targetUserId);
    if (!entry || entry.code !== code || entry.expires < Date.now()) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await User.update(
      { password: newPassword },
      { where: { id: targetUserId }, individualHooks: true }
    );
    
    recoveryCodes.delete(targetUserId);

    return res.json({ message: 'Senha redefinida com sucesso' });
  }

  async listAdminsByHealthUnit(req, res) {
    const { health_unit_id } = req.params;

    const healthUnit = await HealthUnit.findByPk(health_unit_id, {
      include: [
        {
          model: User,
          as: 'admins',
          attributes: { exclude: ['password_hash'] },
          where: { user_type: 'admin' },
        },
      ],
    });

    if (!healthUnit) {
      return res.status(404).json({ error: 'Unidade de saúde não encontrada' });
    }

    return res.json({
      health_unit: healthUnit.name,
      admins: healthUnit.admins,
      total: healthUnit.admins.length,
    });
  }

  async assignHealthUnit(req, res) {
    const { id } = req.params;
    const { health_unit_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.user_type !== 'admin') {
      return res.status(400).json({ error: 'Apenas usuários admin podem ser atribuídos a unidades' });
    }

    if (health_unit_id) {
      const healthUnit = await HealthUnit.findByPk(health_unit_id);
      if (!healthUnit) {
        return res.status(404).json({ error: 'Unidade de saúde não encontrada' });
      }
    }

    try {
      await user.update({ health_unit_id });
      return res.json({ 
        message: health_unit_id ? 'Admin atribuído à unidade com sucesso' : 'Admin convertido para super admin',
        user: await User.findByPk(id, {
          attributes: { exclude: ['password_hash'] },
          include: [{ model: HealthUnit, as: 'health_unit', attributes: ['id', 'name'] }],
        }),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atribuir unidade' });
    }
  }

  async removeHealthUnit(req, res) {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.user_type !== 'admin') {
      return res.status(400).json({ error: 'Apenas usuários admin podem ter unidades removidas' });
    }

    await user.update({ health_unit_id: null });
    return res.json({ 
      message: 'Admin convertido para super admin com sucesso',
      user: await User.findByPk(id, { attributes: { exclude: ['password_hash'] } }),
    });
  }
}

export default new UsersController();
