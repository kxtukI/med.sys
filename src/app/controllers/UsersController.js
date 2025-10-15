import { Op } from 'sequelize';
import * as Yup from 'yup';

import User from '../models/Users.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

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

  async update(req, res) {
    const { id } = req.params;
    const user = await User.findByPk(id);
    await user.update(req.body);
    return res.json({ user });
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
      user = await User.findOne({ where: { email } });
    } else if (cpf) {
      const { default: Patients } = await import('../models/Patients.js');
      const patient = await Patients.findOne({ where: { cpf }, include: [{ model: User, as: 'users' }] });
      if (patient) user = patient.users;
    }
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryCodes.set(user.id, { code, expires: Date.now() + 10 * 60 * 1000 });
    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Recuperação de senha',
        text: `Seu código de recuperação é: ${code}`,
      });
    } else if (cpf) {
      if (user.phone) {
        await twilioClient.messages.create({
          body: `Seu código de recuperação é: ${code}`,
          from: twilioFrom,
          to: `+55${user.phone}`,
        });
      } else {
        return res.status(400).json({ error: 'Usuário não possui telefone cadastrado para envio do código' });
      }
    }
    return res.json({ 
      message: `Código de recuperação enviado no telefone: ${user.phone}`
    });
  }

  async resetPassword(req, res) {
    const { userId, code, newPassword } = req.body;
    
    let targetUserId = userId;
    if (!targetUserId) {
      for (const [id, entry] of recoveryCodes.entries()) {
        if (entry.code === code && entry.expires > Date.now()) {
          targetUserId = id;
          break;
        }
      }
      if (!targetUserId) {
        return res.status(400).json({ error: 'Código inválido ou expirado' });
      }
    }
    
    const entry = recoveryCodes.get(targetUserId);
    if (!entry || entry.code !== code || entry.expires < Date.now()) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }
    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const schema = Yup.object().shape({
      newPassword: Yup.string().required('Senha é obrigatória')
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/, 'Senha deve conter pelo menos uma letra e um número'),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    user.password = newPassword;
    await user.save();
    recoveryCodes.delete(targetUserId);
    return res.json({ message: 'Senha redefinida com sucesso' });
  }
}

export default new UsersController();
