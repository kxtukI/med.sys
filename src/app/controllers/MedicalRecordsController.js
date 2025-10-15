import { Op } from 'sequelize';
import * as Yup from 'yup';
import MedicalRecord from '../models/MedicalRecords.js';
import Professional from '../models/Professionals.js';
import Appointment from '../models/Appointments.js';
import User from '../models/Users.js';
import Patient from '../models/Patients.js';
import Referrals from '../models/Referrals.js';

class MedicalRecordsController {
  async index(req, res) {
    const { professional_id, appointment_id, record_date } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    if (professional_id) where.professional_id = professional_id;
    if (appointment_id) where.appointment_id = appointment_id;
    if (record_date) where.record_date = { [Op.gte]: new Date(record_date) };

    const data = await MedicalRecord.findAndCountAll({
      where,
      include: [
        {
          model: Professional,
          as: 'professional',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'],
            },
          ],
          attributes: ['id', 'professional_register', 'professional_type', 'specialty'],
        },
        {
          model: Appointment,
          as: 'appointment',
          include: [
            {
              model: Patient,
              as: 'patient',
              include: [
                {
                  model: User,
                  as: 'users',
                  attributes: ['id', 'name'],
                },
              ],
              attributes: ['id'],
            },
          ],
          attributes: ['id', 'date_time', 'specialty', 'status'],
        },
      ],
      order: [['record_date', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'professional_id',
        'appointment_id',
        'record_date',
        'observations',
        'prescribed_medications',
        'requested_exams',
        'disease_history',
        'allergies',
        'treatment_plan',
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
    const medicalRecord = await MedicalRecord.findByPk(id, {
      include: [
        {
          model: Professional,
          as: 'professional',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Appointment,
          as: 'appointment',
          include: [
            {
              model: Patient,
              as: 'patient',
              include: [
                {
                  model: User,
                  as: 'users',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        },
        {
          model: Referrals,
          as: 'referral',
        },
      ],
    });
    if (!medicalRecord) {
      return res.status(404).json({ error: 'Prontuário médico não encontrado' });
    }
    return res.json({ medicalRecord });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      professional_id: Yup.number().required('ID do profissional é obrigatório'),
      appointment_id: Yup.number().required('ID do agendamento é obrigatório'),
      observations: Yup.string().nullable(),
      prescribed_medications: Yup.string().nullable(),
      requested_exams: Yup.string().nullable(),
      disease_history: Yup.string().nullable(),
      allergies: Yup.string().nullable(),
      treatment_plan: Yup.string().nullable(),
      referral: Yup.object()
        .shape({
          to_specialty: Yup.string().required(),
          notes: Yup.string().nullable(),
          valid_until: Yup.date().nullable(),
        })
        .nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const {
      professional_id,
      appointment_id,
      observations,
      prescribed_medications,
      requested_exams,
      disease_history,
      allergies,
      treatment_plan,
      referral,
    } = req.body;

    const professional = await Professional.findByPk(professional_id);
    if (!professional) {
      return res.status(400).json({ error: 'Profissional não encontrado' });
    }
    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) {
      return res.status(400).json({ error: 'Agendamento não encontrado' });
    }
    const existingRecord = await MedicalRecord.findOne({ where: { appointment_id } });
    if (existingRecord) {
      return res.status(400).json({ error: 'Já existe um prontuário para este agendamento' });
    }
    const medicalRecord = await MedicalRecord.create({
      professional_id,
      appointment_id,
      observations,
      prescribed_medications,
      requested_exams,
      disease_history,
      allergies,
      treatment_plan,
    });

    if (referral && referral.to_specialty) {
      const createdReferral = await Referrals.create({
        patient_id: appointment.patient_id,
        from_professional_id: professional.id,
        to_specialty: referral.to_specialty,
        notes: referral.notes,
        valid_until: referral.valid_until,
        appointment_id: appointment.id,
        status: 'approved',
      });
      await medicalRecord.update({ referral_id: createdReferral.id });
    }
    return res.json({ medicalRecord });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      observations: Yup.string().optional(),
      prescribed_medications: Yup.string().optional(),
      requested_exams: Yup.string().optional(),
      disease_history: Yup.string().optional(),
      allergies: Yup.string().optional(),
      treatment_plan: Yup.string().optional(),
      referral: Yup.object()
        .shape({
          to_specialty: Yup.string().required(),
          notes: Yup.string().nullable(),
          valid_until: Yup.date().nullable(),
        })
        .nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const medicalRecord = await MedicalRecord.findByPk(id);
    if (!medicalRecord) {
      return res.status(404).json({ error: 'Prontuário médico não encontrado' });
    }
    await medicalRecord.update(req.body);

    const { referral } = req.body;
    if (referral && referral.to_specialty) {
      const appointment = await Appointment.findByPk(medicalRecord.appointment_id);
      const professional = await Professional.findByPk(medicalRecord.professional_id);

      if (medicalRecord.referral_id) {
        const existing = await Referrals.findByPk(medicalRecord.referral_id);
        if (existing) {
          await existing.update({
            to_specialty: referral.to_specialty,
            notes: referral.notes,
            valid_until: referral.valid_until,
          });
        }
      } else {
        const createdReferral = await Referrals.create({
          patient_id: appointment.patient_id,
          from_professional_id: professional.id,
          to_specialty: referral.to_specialty,
          notes: referral.notes,
          valid_until: referral.valid_until,
          appointment_id: appointment.id,
          status: 'approved',
        });
        await medicalRecord.update({ referral_id: createdReferral.id });
      }
    }

    return res.json({ medicalRecord });
  }

  async findByPatient(req, res) {
    const { patient_id } = req.params;
    const { limit, offset } = req.pagination;

    const data = await MedicalRecord.findAndCountAll({
      include: [
        {
          model: Professional,
          as: 'professional',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name'],
            },
          ],
          attributes: ['id', 'professional_register', 'professional_type', 'specialty'],
        },
        {
          model: Appointment,
          as: 'appointment',
          where: { patient_id },
          include: [
            {
              model: Patient,
              as: 'patient',
              include: [
                {
                  model: User,
                  as: 'users',
                  attributes: ['id', 'name'],
                },
              ],
              attributes: ['id'],
            },
          ],
          attributes: ['id', 'date_time', 'specialty', 'status'],
        },
      ],
      order: [['record_date', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'professional_id',
        'appointment_id',
        'record_date',
        'observations',
        'prescribed_medications',
        'requested_exams',
        'disease_history',
        'allergies',
        'treatment_plan',
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

  async delete(req, res) {
    const { id } = req.params;
    const medicalRecord = await MedicalRecord.findByPk(id);
    if (!medicalRecord) {
      return res.status(404).json({ error: 'Prontuário médico não encontrado' });
    }
    await medicalRecord.destroy();
    return res.json({ message: 'Prontuário médico removido com sucesso' });
  }
}

export default new MedicalRecordsController();
