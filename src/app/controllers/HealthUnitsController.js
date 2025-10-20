import { Op } from 'sequelize';
import * as Yup from 'yup';
import HealthUnit from '../models/HealthUnits.js';

class HealthUnitsController {
  async index(req, res) {
    const { name, city, state } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };

    const data = await HealthUnit.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
      attributes: ['id', 'name', 'address', 'city', 'state', 'zip_code', 'phone', 'working_hours', 'photo_url'],
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
    const healthUnit = await HealthUnit.findByPk(id);
    if (!healthUnit) {
      return res.status(404).json({ error: 'Unidade de Saúde não encontrada' });
    }
    return res.json({ healthUnit });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required('Nome é obrigatório'),
      address: Yup.string().required('Endereço é obrigatório'),
      city: Yup.string().required('Cidade é obrigatória'),
      state: Yup.string().required('Estado é obrigatório').length(2, 'A sigla do estado  deve ter 2 caracteres'),
      zip_code: Yup.string().required('CEP é obrigatório').matches(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
      phone: Yup.string().nullable().matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      working_hours: Yup.string().nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const healthUnitData = { ...req.body };

    if (req.file && req.file.cloudinaryUrl) {
      healthUnitData.photo_url = req.file.cloudinaryUrl;
    }

    const healthUnit = await HealthUnit.create(healthUnitData);

    return res.json({ healthUnit });
  }


  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().optional(),
      address: Yup.string().optional(),
      city: Yup.string().optional(),
      state: Yup.string().optional().length(2, 'A sigla do estado deve ter 2 caracteres'),
      zip_code: Yup.string().optional().matches(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
      phone: Yup.string().optional().matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      working_hours: Yup.string().optional(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const healthUnit = await HealthUnit.findByPk(id);
    if (!healthUnit) {
      return res.status(404).json({ error: 'Unidade de Saúde não encontrada' });
    }

    const updateData = { ...req.body };

    if (req.file && req.file.cloudinaryUrl) {
      updateData.photo_url = req.file.cloudinaryUrl;
    }

    await healthUnit.update(updateData);
    return res.json({ healthUnit });
  }

  async delete(req, res) {
    const { id } = req.params;
    const healthUnit = await HealthUnit.findByPk(id);
    if (!healthUnit) {
      return res.status(404).json({ error: 'Unidade de Saúde não encontrada' });
    }
    await healthUnit.destroy();
    return res.json({ message: 'Unidade de Saúde removida com sucesso' });
  }
}

export default new HealthUnitsController();
