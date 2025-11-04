import { Op } from 'sequelize';
import * as Yup from 'yup';
import Professionals from '../models/Professionals.js';
import User from '../models/Users.js';
import HealthUnit from '../models/HealthUnits.js';
import ProfessionalHealthUnits from '../models/ProfessionalHealthUnits.js';

class ProfessionalsController {
  async index(req, res) {
    const { name, professional_register, professional_type, specialty, status, health_unit_id } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    const userWhere = {};
    if (name) userWhere.name = { [Op.iLike]: `%${name}%` };
    if (professional_register) where.professional_register = { [Op.iLike]: `%${professional_register}%` };
    if (professional_type) where.professional_type = professional_type;
    if (specialty) where.specialty = { [Op.iLike]: `%${specialty}%` };
    if (status) where.status = status;

    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email', 'user_type', 'active'],
      required: true,
    };

    if (Object.keys(userWhere).length > 0) {
      userInclude.where = userWhere;
    }

    const includes = [
      userInclude,
      {
        association: 'health_units',
        attributes: ['id', 'name', 'city', 'state'],
        through: { attributes: ['status', 'start_date'] },
      },
    ];

    if (health_unit_id) {
      includes[1].where = { id: health_unit_id };
      includes[1].required = true;
    }

    const data = await Professionals.findAndCountAll({
      where,
      include: includes,
      order: [['id', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'professional_register', 'professional_type', 'specialty', 'photo_url', 'status'],
      distinct: true,
    });

    return res.json({
      data: data.rows.map((prof) => ({
        ...prof.toJSON(),
        user: prof.user,
        health_units: prof.health_units,
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
          association: 'health_units',
          attributes: ['id', 'name', 'address', 'city', 'state', 'phone'],
          through: { attributes: ['status', 'start_date', 'end_date'] },
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
      name: Yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter no mínimo 3 caracteres').matches(/^[\p{L}\p{M}\s'.-]+$/u, 'Nome deve conter apenas letras, espaços e alguns caracteres especiais'),
      email: Yup.string().email('Email inválido').required('Email é obrigatório'),
      phone: Yup.string().required('Telefone é obrigatório').matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      password: Yup.string().required('Senha é obrigatória').min(8, 'Senha deve ter no mínimo 8 caracteres').matches(/^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/, 'Senha deve conter pelo menos uma letra e um número'),
      professional_register: Yup.string().required('Registro profissional é obrigatório'),
      professional_type: Yup.string().oneOf(['doctor', 'administrative']).required('Tipo é obrigatório'),
      specialty: Yup.string().nullable(),
      health_unit_ids: Yup.array().of(Yup.number()).min(1, 'Pelo menos uma unidade de saúde é obrigatória'),
      photo_url: Yup.string().nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { name, email, phone, password, professional_register, professional_type, specialty, health_unit_ids } = req.body;

    const existingProfessional = await Professionals.findOne({ where: { professional_register } });
    if (existingProfessional) {
      return res.status(400).json({ error: 'Registro profissional já cadastrado.' });
    }

    const professionalData = { professional_register, professional_type, specialty };

    if (req.file && req.file.cloudinaryUrl) {
      professionalData.photo_url = req.file.cloudinaryUrl;
    }

    try {
      const user = await User.create({ name, email, phone, password, user_type: 'professional' });
      const professional = await Professionals.create({ user_id: user.id, ...professionalData });

      const healthUnitRelationships = health_unit_ids.map(unitId => ({
        professional_id: professional.id,
        health_unit_id: unitId,
        status: 'active',
      }));

      await ProfessionalHealthUnits.bulkCreate(healthUnitRelationships);

      const createdProfessional = await Professionals.findByPk(professional.id, {
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password_hash'] } },
          {
            association: 'health_units',
            attributes: ['id', 'name', 'city'],
            through: { attributes: ['status'] },
          },
        ],
      });

      return res.json({ professional: createdProfessional });
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao criar profissional', details: error.message });
    }
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().optional().min(3, 'Nome deve ter no mínimo 3 caracteres').matches(/^[\p{L}\p{M}\s'.-]+$/u, 'Nome deve conter apenas letras, espaços e alguns caracteres especiais'),
      email: Yup.string().optional().email('Email inválido'),
      phone: Yup.string().optional().matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      password: Yup.string().optional().min(8, 'Senha deve ter no mínimo 8 caracteres').matches(/^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/, 'Senha deve conter pelo menos uma letra e um número'),
      professional_register: Yup.string().optional(),
      professional_type: Yup.string().oneOf(['doctor', 'administrative']).optional(),
      specialty: Yup.string().optional(),
      health_unit_ids: Yup.array().of(Yup.number()).optional(),
      photo_url: Yup.string().optional(),
      status: Yup.string().oneOf(['active', 'inactive']).optional(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { name, email, phone, password, professional_register, professional_type, specialty, health_unit_ids, photo_url, status } = req.body;
    const { id } = req.params;

    const professional = await Professionals.findByPk(id);
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }
    const user = await User.findByPk(professional.user_id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const professionalUpdateData = {
      professional_register: professional_register ?? professional.professional_register,
      professional_type: professional_type ?? professional.professional_type,
      specialty: specialty ?? professional.specialty,
      status: status ?? professional.status,
    };

    if (photo_url) {
      professionalUpdateData.photo_url = photo_url;
    }

    if (req.file && req.file.cloudinaryUrl) {
      professionalUpdateData.photo_url = req.file.cloudinaryUrl;
    }

    try {
      await user.update({
        name: name ?? user.name,
        email: email ?? user.email,
        phone: phone ?? user.phone,
        password: password ?? user.password,
      });
      await professional.update(professionalUpdateData);
      if (health_unit_ids && Array.isArray(health_unit_ids)) {
        await ProfessionalHealthUnits.destroy({ where: { professional_id: id } });

        const healthUnitRelationships = health_unit_ids.map(unitId => ({
          professional_id: id,
          health_unit_id: unitId,
          status: 'active',
        }));

        await ProfessionalHealthUnits.bulkCreate(healthUnitRelationships);
      }

      const updatedProfessional = await Professionals.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password_hash'] } },
          {
            association: 'health_units',
            attributes: ['id', 'name', 'city', 'state'],
            through: { attributes: ['status', 'start_date'] },
          },
        ],
      });

      return res.json({ professional: updatedProfessional });
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao atualizar profissional', details: error.message });
    }
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
