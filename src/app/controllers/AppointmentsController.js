import { Op } from 'sequelize';
import * as Yup from 'yup';
import Appointment from '../models/Appointments.js';
import Patient from '../models/Patients.js';
import Professional from '../models/Professionals.js';
import HealthUnit from '../models/HealthUnits.js';
import Referrals from '../models/Referrals.js';
import User from '../models/Users.js';
import sequelize from '../../database/index.js';

const fullAppointmentIncludes = [
  {
    model: Patient,
    as: 'patient',
    include: [{ model: User, as: 'users', attributes: ['id', 'name'] }]
  },
  {
    model: Professional,
    as: 'professional',
    include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    attributes: ['id', 'specialty']
  },
  {
    model: HealthUnit,
    as: 'health_unit',
    attributes: ['id', 'name']
  },
];

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
      include: fullAppointmentIncludes,
      order: [['date_time', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      data: data.rows,
      pagination: {
        total: data.count,
        limit,
        page: offset / limit + 1,
        pages: Math.ceil(data.count / limit),
      }
    });
  }

  async show(req, res) {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id, {
      include: fullAppointmentIncludes,
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

    const t = await sequelize.transaction();

    try {
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

      const existingAppointment = await Appointment.findOne({
        where: {
          professional_id,
          date_time,
          status: { [Op.ne]: 'canceled' }
        },
        transaction: t,
      });

      if (existingAppointment) {
        return res.status(409).json({ error: 'Conflito de agendamento', details: 'O profissional já possui uma consulta neste horário.' }); // 409 Conflict
      }

      const isSpecialist = specialty && specialty.toLowerCase() !== 'clínico geral';
      if (isSpecialist) {
        const now = new Date();
        const referral = await Referrals.findOne({
          where: {
            patient_id,
            to_specialty: specialty,
            status: 'approved',
          },
          order: [['id', 'DESC']],
        });

        if (!referral || referral.valid_until && new Date(referral.valid_until) < now) {
          return res.status(403).json({
            error: 'Encaminhamento obrigatório',
            details: [`Não há encaminhamento aprovado para a especialidade ${specialty}`],
          });
        }

        await referral.update({ status: 'used' }, { transaction: t });
      }

      const appointment = await Appointment.create({
        patient_id,
        professional_id,
        health_unit_id,
        date_time,
        specialty,
        status: status || 'scheduled',
      }, { transaction: t });

      await t.commit();

      const newAppointment = await Appointment.findByPk(appointment.id, {
        include: fullAppointmentIncludes
      });

      return res.status(201).json({ appointment: newAppointment });

    } catch (error) {
      await t.rollback();
      return res.status(500).json({ error: 'Falha ao criar agendamento.', details: error.message });
    }
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

    if (appointment.status === 'completed' || appointment.status === 'canceled') {
      return res.status(403).json({ error: 'Ação não permitida', details: `Não é possível alterar um agendamento com status '${appointment.status}'.` });
    }

    await appointment.update(req.body);
    await appointment.reload({ include: fullAppointmentIncludes });

    return res.json({ appointment });
  }

  async delete(req, res) {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    if (appointment.status === 'completed') {
      return res.status(403).json({ error: 'Ação não permitida', details: 'Não é possível remover um agendamento concluído.' });
    }

    await appointment.update({ status: 'canceled' });

    return res.json({ message: 'Agendamento cancelado com sucesso', appointment });
  }
}

export default new AppointmentsController();
