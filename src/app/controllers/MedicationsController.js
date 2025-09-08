import { Op } from 'sequelize';
import * as Yup from 'yup';
import Medication from '../models/Medications.js';

class MedicationsController {
  async index(req, res) {
    const { name, category, active_ingredient } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (category) where.category = { [Op.iLike]: `%${category}%` };
    if (active_ingredient) where.active_ingredient = { [Op.iLike]: `%${active_ingredient}%` };

    const data = await Medication.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
      attributes: [
        'id',
        'name',
        'active_ingredient',
        'category',
        'description',
        'dosage',
        'contraindications',
        'manufacturer',
      ],
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
    const medication = await Medication.findByPk(id);
    if (!medication) {
      return res.status(404).json({ error: 'Medicamento não encontrado' });
    }
    return res.json({ medication });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required('Nome é obrigatório'),
      active_ingredient: Yup.string().required('Princípio ativo é obrigatório'),
      category: Yup.string().required('Categoria é obrigatória'),
      description: Yup.string().nullable(),
      dosage: Yup.string().nullable(),
      contraindications: Yup.string().nullable(),
      manufacturer: Yup.string().nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { name, active_ingredient, category, description, dosage, contraindications, manufacturer } = req.body;
    const medication = await Medication.create({ name, active_ingredient, category, description, dosage, contraindications, manufacturer });
    return res.json({ medication });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().optional(),
      active_ingredient: Yup.string().optional(),
      category: Yup.string().optional(),
      description: Yup.string().optional(),
      dosage: Yup.string().optional(),
      contraindications: Yup.string().optional(),
      manufacturer: Yup.string().optional(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const medication = await Medication.findByPk(id);
    if (!medication) {
      return res.status(404).json({ error: 'Medicamento não encontrado' });
    }

    await medication.update(req.body);
    return res.json({ medication });
  }

  async delete(req, res) {
    const { id } = req.params;
    const medication = await Medication.findByPk(id);
    if (!medication) {
      return res.status(404).json({ error: 'Medicamento não encontrado' });
    }
    await medication.destroy();
    return res.json({ message: 'Medicamento removido com sucesso' });
  }
}

export default new MedicationsController();
