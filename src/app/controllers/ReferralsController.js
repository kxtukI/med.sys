import * as Yup from 'yup';
import { injectUserResourceId } from '../utils/authUtils.js';
import Referrals from '../models/Referrals.js';
import Patients from '../models/Patients.js';
import Professionals from '../models/Professionals.js';

class ReferralsController {
  async index(req, res) {
    const { patient_id, to_specialty, status } = req.query;
    const where = {};
    if (patient_id) where.patient_id = patient_id;
    if (to_specialty) where.to_specialty = to_specialty;
    if (status) where.status = status;

    const referrals = await Referrals.findAll({ where });
    return res.json({ data: referrals });
  }

  async show(req, res) {
    const { id } = req.params;
    const referral = await Referrals.findByPk(id);
    if (!referral) return res.status(404).json({ error: 'Encaminhamento não encontrado' });
    return res.json({ referral });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      patient_id: Yup.number().required(),
      to_specialty: Yup.string().required(),
      notes: Yup.string().nullable(),
      valid_until: Yup.date().nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema
        .validate(req.body, { abortEarly: false })
        .catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { patient_id, to_specialty, notes, valid_until } = req.body;

    const patient = await Patients.findByPk(patient_id);
    if (!patient) return res.status(400).json({ error: 'Paciente não encontrado' });

    const referralData = await injectUserResourceId(req, {
      patient_id,
      to_specialty,
      notes,
      valid_until,
      status: 'pending',
    }, 'from_professional_id');

    const referral = await Referrals.create(referralData);
    return res.status(201).json({ referral });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      status: Yup.string().oneOf(['pending', 'approved', 'used', 'canceled']).optional(),
      notes: Yup.string().optional(),
      valid_until: Yup.date().nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema
        .validate(req.body, { abortEarly: false })
        .catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const referral = await Referrals.findByPk(id);
    if (!referral) return res.status(404).json({ error: 'Encaminhamento não encontrado' });

    await referral.update(req.body);
    return res.json({ referral });
  }
}

export default new ReferralsController();


