import { Op } from 'sequelize';
import * as Yup from 'yup';
import { formatDateOnlyToDisplay } from '../utils/dateUtils.js';
import Professionals from '../models/Professionals.js';
import User from '../models/Users.js';
import HealthUnit from '../models/HealthUnits.js';

class ProfessionalsController {
  async index(req, res) {
    const { name, professional_register, professional_type, specialty, status } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    const userWhere = {};

    if (name) {
      userWhere.name = { [Op.iLike]: `%${name}%` };
    }
    if (professional_register) {
      where.professional_register = { [Op.iLike]: `%${professional_register}%` };
    }
    if (professional_type) {
      where.professional_type = professional_type;
    }
    if (specialty) {
      where.specialty = { [Op.iLike]: `%${specialty}%` };
    }
    if (status) {
      where.status = status;
    }

    const data = await Professionals.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'user_type', 'active'],
          where: userWhere,
          required: true
        },
        {
          model: HealthUnit,
          as: 'health_unit',
          attributes: ['id', 'name', 'city', 'state'],
        }
      ],
      order: [
        [{ model: User, as: 'user' }, 'active', 'DESC'],
        [{ model: User, as: 'user' }, 'registration_date', 'DESC'],
      ],
      limit,
      offset,
      attributes: ['id', 'professional_register', 'professional_type', 'specialty', 'photo_url', 'status'],
    });

    return res.json({
      data: data.rows.map((prof) => ({
        ...prof.toJSON(),
        user: prof.user,
        health_unit: prof.health_unit,
      })),
      total: data.count,
      limit,
      page: offset / limit + 1,
      pages: Math.ceil(data.count / limit),
    });
  }

  async show(req, res) {
    const { id } = req.params;
    const professional = await Professionals.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password_hash'] },
        },
        {
          model: HealthUnit,
          as: 'health_unit',
        },
      ],
    });
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }
    return res.json({ professional });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter no mínimo 3 caracteres'),
      email: Yup.string().email('Email inválido').required('Email é obrigatório'),
      phone: Yup.string().required('Telefone é obrigatório').matches(/^[0-9]{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      password: Yup.string().required('Senha é obrigatória').min(8, 'Senha deve ter no mínimo 8 caracteres'),
      professional_register: Yup.string().required('Registro profissional é obrigatório'),
      professional_type: Yup.string().oneOf(['doctor', 'administrative']).required('Tipo é obrigatório'),
      specialty: Yup.string().nullable(),
      health_unit_id: Yup.number().nullable(),
      photo_url: Yup.string().nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { name, email, phone, password, professional_register, professional_type, specialty, health_unit_id, photo_url } = req.body;

    // Verifica se já existe registro profissional
    const existingProfessional = await Professionals.findOne({ where: { professional_register } });
    if (existingProfessional) {
      return res.status(400).json({ error: 'Registro profissional já cadastrado.' });
    }

    // Cria usuário
    const user = await User.create({
      name,
      email,
      phone,
      password,
      user_type: 'professional',
    });

    // Cria profissional
    const professional = await Professionals.create({
      user_id: user.id,
      professional_register,
      professional_type,
      specialty,
      health_unit_id,
      photo_url,
    });

    return res.json({
      professional: {
        id: professional.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        professional_register: professional.professional_register,
        professional_type: professional.professional_type,
        specialty: professional.specialty,
        health_unit_id: professional.health_unit_id,
        photo_url: professional.photo_url,
        status: professional.status,
      },
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().optional().min(3, 'Nome deve ter no mínimo 3 caracteres'),
      email: Yup.string().optional().email('Email inválido'),
      phone: Yup.string().optional().matches(/^[0-9]{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      password: Yup.string().optional().min(8, 'Senha deve ter no mínimo 8 caracteres'),
      professional_register: Yup.string().optional(),
      professional_type: Yup.string().oneOf(['doctor', 'administrative']).optional(),
      specialty: Yup.string().optional(),
      health_unit_id: Yup.number().optional(),
      photo_url: Yup.string().optional(),
      status: Yup.string().oneOf(['active', 'inactive']).optional(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { name, email, phone, password, professional_register, professional_type, specialty, health_unit_id, photo_url, status } = req.body;
    const { id } = req.params;

    const professional = await Professionals.findByPk(id);
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const user = await User.findByPk(professional.user_id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await user.update({
      name: name ?? user.name,
      email: email ?? user.email,
      phone: phone ?? user.phone,
      password: password ?? user.password,
    });

    await professional.update({
      professional_register: professional_register ?? professional.professional_register,
      professional_type: professional_type ?? professional.professional_type,
      specialty: specialty ?? professional.specialty,
      health_unit_id: health_unit_id ?? professional.health_unit_id,
      photo_url: photo_url ?? professional.photo_url,
      status: status ?? professional.status,
    });

    const updatedProfessional = await Professionals.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password_hash'] } },
        { model: HealthUnit, as: 'health_unit' },
      ],
    });

    return res.json({ professional: updatedProfessional });
  }

  async delete(req, res) {
    const { id } = req.params;
    const professional = await Professionals.findByPk(id);
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }
    const user = await User.findByPk(professional.user_id);
    if (user) {
      await user.update({ active: false });
    }
    return res.json({ message: 'Profissional desativado com sucesso' });
  }
}

export default new ProfessionalsController();
