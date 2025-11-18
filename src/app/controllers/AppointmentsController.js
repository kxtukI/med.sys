import { Op } from 'sequelize';
import * as Yup from 'yup';
import { injectUserResourceId } from '../utils/authUtils.js';
import { isWithinWorkingHours } from '../utils/dateUtils.js';
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
      professional_id: Yup.number().required('ID do profissional é obrigatório'),
      health_unit_id: Yup.number().required('ID da unidade de saúde é obrigatório'),
      date_time: Yup.date().required('Data e hora são obrigatórias'),
      specialty: Yup.string().required('Especialidade é obrigatória'),
      status: Yup.string().oneOf(['scheduled', 'canceled', 'completed']).default('scheduled'),
      patient_id: Yup.number().nullable() 
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { professional_id, health_unit_id, date_time, specialty, status, patient_id } = req.body;
    const currentUser = req.currentUser;

    let patientId = patient_id;
    if (currentUser.user_type === 'patient' || !patientId) {
      const PatientModel = (await import('../models/Patients.js')).default;
      const patient = await PatientModel.findOne({ where: { user_id: currentUser.id } });
      if (!patient) {
        return res.status(404).json({ error: 'Paciente não encontrado para este usuário' });
      }
      patientId = patient.id;
    }

    const appointmentDate = new Date(date_time);
    const now = new Date();
    if (appointmentDate < now) {
      return res.status(400).json({ error: 'Data inválida', details: 'Não é possível agendar para uma data no passado' });
    }

    const appointmentData = await injectUserResourceId(req, {
      patient_id: patientId,
      professional_id,
      health_unit_id,
      date_time,
      specialty,
      status: status || 'scheduled',
    });

    const patient = await Patient.findByPk(patientId);
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

    const workingHoursValidation = isWithinWorkingHours(healthUnit.working_hours, appointmentDate);
    if (!workingHoursValidation.isValid) {
      return res.status(400).json({ 
        error: 'Horário fora do funcionamento', 
        details: workingHoursValidation.message || 'O agendamento deve ser feito dentro do horário de funcionamento da unidade'
      });
    }

    const professionalHealthUnit = await Professional.findByPk(professional_id, {
      include: [
        {
          association: 'health_units',
          where: { id: health_unit_id },
          through: { where: { status: 'active' } },
          required: false,
        },
      ],
    });

    if (!professionalHealthUnit || professionalHealthUnit.health_units.length === 0) {
      return res.status(400).json({
        error: 'Profissional não disponível',
        details: 'O profissional selecionado não trabalha nesta unidade de saúde',
      });
    }

    const existingAppointment = await Appointment.findOne({
      where: {
        professional_id,
        date_time,
        status: { [Op.ne]: 'canceled' }
      },
    });

    if (existingAppointment) {
      return res.status(409).json({ error: 'Conflito de agendamento', details: 'O profissional já possui uma consulta neste horário.' });
    }

    const isSpecialist = specialty && specialty.toLowerCase() !== 'clínico geral';
    let referral = null;
    if (isSpecialist) {
      referral = await Referrals.findOne({
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
    }

    const t = await sequelize.transaction();

    try {
      const appointment = await Appointment.create(appointmentData, { transaction: t });

      if (isSpecialist && referral) {
        await referral.update({ status: 'used' }, { transaction: t });
      }

      await t.commit();

      const Notifications = (await import('../models/Notifications.js')).default;
      const _appointmentDate = new Date(appointment.date_time);
      function setToTodayAtEight(dateTarget) {
        const day = new Date(dateTarget);
        day.setHours(8, 0, 0, 0);
        return day;
      }
      const oneDayBefore = new Date(_appointmentDate.getTime() - 24 * 60 * 60 * 1000);
      const onDayMorning = setToTodayAtEight(_appointmentDate);
      const oneHourBefore = new Date(_appointmentDate.getTime() - 60 * 60 * 1000);
      await Notifications.bulkCreate([
        {
          target_type: 'patient',
          target_id: appointment.patient_id,
          appointment_id: appointment.id,
          type: 'appointment_reminder',
          message: `Lembrete: sua consulta é amanhã às ${_appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          channel: 'sms',
          status: 'pending',
          scheduled_for: oneDayBefore
        },
        {
          target_type: 'patient',
          target_id: appointment.patient_id,
          appointment_id: appointment.id,
          type: 'appointment_reminder',
          message: `Lembrete: sua consulta é hoje às ${_appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          channel: 'sms',
          status: 'pending',
          scheduled_for: onDayMorning
        },
        {
          target_type: 'patient',
          target_id: appointment.patient_id,
          appointment_id: appointment.id,
          type: 'appointment_reminder',
          message: `Lembrete: falta 1 hora para sua consulta.`,
          channel: 'sms',
          status: 'pending',
          scheduled_for: oneHourBefore
        }
      ]);

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

    if (req.body.date_time) {
      const newAppointmentDate = new Date(req.body.date_time);
      const healthUnit = await HealthUnit.findByPk(appointment.health_unit_id);
      
      if (healthUnit) {
        const workingHoursValidation = isWithinWorkingHours(healthUnit.working_hours, newAppointmentDate);
        if (!workingHoursValidation.isValid) {
          return res.status(400).json({ 
            error: 'Horário fora do funcionamento', 
            details: workingHoursValidation.message || 'O agendamento deve ser feito dentro do horário de funcionamento da unidade'
          });
        }
      }
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

  async calendar(req, res) {
    const { professional_id, health_unit_id, start_date, end_date, status } = req.query;
    
    let user = req.currentUser;
    if (!user && req.userId) {
      user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    let targetProfessionalId = professional_id;

    if (user.user_type === 'professional') {
      const professional = await Professional.findOne({ where: { user_id: user.id } });
      if (!professional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }
      targetProfessionalId = professional.id;
    }

    if (!targetProfessionalId) {
      return res.status(400).json({ error: 'professional_id é obrigatório' });
    }

    const professional = await Professional.findByPk(targetProfessionalId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    });
    if (!professional) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const now = new Date();
    const defaultStartDate = new Date(now.setDate(now.getDate() - now.getDay())); 
    defaultStartDate.setHours(0, 0, 0, 0);
    
    const defaultEndDate = new Date(defaultStartDate);
    defaultEndDate.setDate(defaultEndDate.getDate() + 6); 
    defaultEndDate.setHours(23, 59, 59, 999);

    const startDate = start_date ? new Date(start_date) : defaultStartDate;
    const endDate = end_date ? new Date(end_date) : defaultEndDate;

    if (startDate > endDate) {
      return res.status(400).json({ error: 'Data inicial deve ser anterior à data final' });
    }

    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      return res.status(400).json({ error: 'Intervalo máximo permitido é de 30 dias' });
    }

    const where = {
      professional_id: targetProfessionalId,
      date_time: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (health_unit_id) {
      where.health_unit_id = health_unit_id;
    }

    if (status) {
      where.status = status;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'users', attributes: ['id', 'name'] }],
        },
        {
          model: HealthUnit,
          as: 'health_unit',
          attributes: ['id', 'name', 'address'],
        },
      ],
      order: [['date_time', 'ASC']],
    });

    const calendar = {};
    appointments.forEach(appointment => {
      const date = new Date(appointment.date_time);
      const dateKey = date.toISOString().split('T')[0]; 
      
      if (!calendar[dateKey]) {
        calendar[dateKey] = {
          date: dateKey,
          day_name: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
          day_number: date.getDate(),
          appointments: [],
        };
      }

      calendar[dateKey].appointments.push({
        id: appointment.id,
        time: date.toTimeString().split(' ')[0].substring(0, 5), // HH:mm
        date_time: appointment.date_time,
        specialty: appointment.specialty,
        status: appointment.status,
        patient: appointment.patient?.users?.name || 'N/A',
        health_unit: appointment.health_unit?.name || 'N/A',
      });
    });

    const calendarArray = Object.values(calendar).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const stats = {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      canceled: appointments.filter(a => a.status === 'canceled').length,
    };

    return res.json({
      professional: {
        id: professional.id,
        name: professional.user?.name || 'N/A',
        specialty: professional.specialty,
      },
      period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        days: Math.floor(daysDiff) + 1,
      },
      calendar: calendarArray,
      stats,
    });
  }
}

export default new AppointmentsController();
