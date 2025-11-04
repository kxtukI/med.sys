import { Op } from 'sequelize';
import * as Yup from 'yup';
import MedicationInventory from '../models/MedicationInventory.js';
import Medication from '../models/Medications.js';
import HealthUnit from '../models/HealthUnits.js';

class MedicationInventoryController {
  async index(req, res) {
    const { medication_id, health_unit_id, available_quantity } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    if (medication_id) where.medication_id = medication_id;
    
    const unitId = req.userHealthUnitId || health_unit_id;
    if (unitId) where.health_unit_id = unitId;
    
    if (available_quantity) where.available_quantity = { [Op.gte]: parseInt(available_quantity) };

    const data = await MedicationInventory.findAndCountAll({
      where,
      include: [
        {
          model: Medication,
          as: 'medication',
          attributes: ['id', 'name', 'active_ingredient', 'category'],
        },
        {
          model: HealthUnit,
          as: 'healthUnit',
          attributes: ['id', 'name', 'city', 'state'],
        },
      ],
      order: [['update_date', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'medication_id', 'health_unit_id', 'available_quantity', 'update_date'],
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
    const inventory = await MedicationInventory.findByPk(id, {
      include: [
        {
          model: Medication,
          as: 'medication',
        },
        {
          model: HealthUnit,
          as: 'healthUnit',
        },
      ],
    });
    if (!inventory) {
      return res.status(404).json({ error: 'Medicamento não disponível no estoque' });
    }
    return res.json({ inventory });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      medication_id: Yup.number().required('ID do medicamento é obrigatório'),
      health_unit_id: Yup.number().nullable(), 
      available_quantity: Yup.number().required('Quantidade disponível é obrigatória').min(0, 'Quantidade não pode ser negativa'),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { medication_id, health_unit_id, available_quantity } = req.body;
    
    const unitId = req.userHealthUnitId || health_unit_id;
    if (!unitId) {
      return res.status(400).json({ error: 'ID da unidade de saúde é obrigatório' });
    }
    
    const medication = await Medication.findByPk(medication_id);
    if (!medication) {
      return res.status(400).json({ error: 'Medicamento não encontrado' });
    }
    const healthUnit = await HealthUnit.findByPk(unitId);
    if (!healthUnit) {
      return res.status(400).json({ error: 'Unidade de saúde não encontrada' });
    }
    const existingInventory = await MedicationInventory.findOne({ where: { medication_id, health_unit_id: unitId } });
    if (existingInventory) {
      return res.status(400).json({ error: 'Já existe um registro para este medicamento nesta unidade de saúde' });
    }
    const inventory = await MedicationInventory.create({ medication_id, health_unit_id: unitId, available_quantity });
    return res.json({ inventory });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      available_quantity: Yup.number().required('Quantidade disponível é obrigatória').min(0, 'Quantidade não pode ser negativa'),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const { available_quantity } = req.body;
    const inventory = await MedicationInventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Medicamento não disponível no estoque' });
    }
    await inventory.update({ available_quantity });
    return res.json({ inventory });
  }

  async delete(req, res) {
    const { id } = req.params;
    const inventory = await MedicationInventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Medicamento não disponível no estoque' });
    }
    await inventory.destroy();
    return res.json({ message: 'Medicamento removido do estoque com sucesso' });
  }
}

export default new MedicationInventoryController();
