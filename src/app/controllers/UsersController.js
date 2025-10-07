import { Op } from 'sequelize';

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
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ error: 'Informe email ou telefone' });
    }
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
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
    } else if (phone) {
      await twilioClient.messages.create({
        body: `Seu código de recuperação é: ${code}`,
        from: twilioFrom,
        to: `+55${phone}`,
      });
    }
    return res.json({ message: 'Código de recuperação enviado' });
  }

  async validateRecoveryCode(req, res) {
    const { userId, code } = req.body;
    const entry = recoveryCodes.get(userId);
    if (!entry || entry.code !== code || entry.expires < Date.now()) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }
    return res.json({ message: 'Código válido' });
  }

  async resetPassword(req, res) {
    const { userId, code, newPassword } = req.body;
    const entry = recoveryCodes.get(userId);
    if (!entry || entry.code !== code || entry.expires < Date.now()) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    user.password = newPassword;
    await user.save();
    recoveryCodes.delete(userId);
    return res.json({ message: 'Senha redefinida com sucesso' });
  }
}

export default new UsersController();
