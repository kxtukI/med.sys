import { Op } from 'sequelize';
import * as Yup from 'yup';
import Appointment from '../models/Appointments.js';
import Patient from '../models/Patients.js';
import Professional from '../models/Professionals.js';
import HealthUnit from '../models/HealthUnits.js';

class AppointmentsController {
  async index(req, res) {
    const { patient_id, professional_id, health_unit_id, status, date_time } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    if (patient_id) where.patient_id = patient_id;
    if (professional_id) where.professional_id = professional_id;
    if (health_unit_id) where.health_unit_id = health_unit_id;
    if (status) where.status = status;
    if (date_time) where.date_time = { [Op.gte]: new Date(date_time) };

    const data = await Appointment.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id'] },
        { model: Professional, as: 'professional', attributes: ['id', 'professional_register', 'specialty'] },
        { model: HealthUnit, as: 'health_unit', attributes: ['id', 'name', 'city', 'state'] },
      ],
      order: [['date_time', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'patient_id',
        'professional_id',
        'health_unit_id',
        'date_time',
        'specialty',
        'status',
        'schedule_date',
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
    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Professional, as: 'professional' },
        { model: HealthUnit, as: 'health_unit' },
      ],
    });
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    return res.json({ appointment });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      patient_id: Yup.number().required('ID do paciente é obrigatório'),
      professional_id: Yup.number().required('ID do profissional é obrigatório'),
      health_unit_id: Yup.number().required('ID da unidade de saúde é obrigatório'),
      date_time: Yup.date().required('Data e hora são obrigatórias'),
      specialty: Yup.string().required('Especialidade é obrigatória'),
      status: Yup.string().oneOf(['scheduled', 'canceled', 'completed']).default('scheduled'),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { patient_id, professional_id, health_unit_id, date_time, specialty, status } = req.body;

    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(400).json({ error: 'Paciente não encontrado' });
    }

    const professional = await Professional.findByPk(professional_id);
    if (!professional) {
      return res.status(400).json({ error: 'Profissional não encontrado' });
    }

    const healthUnit = await HealthUnit.findByPk(health_unit_id);
    if (!healthUnit) {
      return res.status(400).json({ error: 'Unidade de saúde não encontrada' });
    }

    const appointment = await Appointment.create({
      patient_id,
      professional_id,
      health_unit_id,
      date_time,
      specialty,
      status: status || 'scheduled',
    });

    return res.json({ appointment });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      date_time: Yup.date().optional(),
      specialty: Yup.string().optional(),
      status: Yup.string().oneOf(['scheduled', 'canceled', 'completed']).optional(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    await appointment.update(req.body);
    return res.json({ appointment });
  }

  async delete(req, res) {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    await appointment.destroy();
    return res.json({ message: 'Agendamento removido com sucesso' });
  }
}

export default new AppointmentsController();
