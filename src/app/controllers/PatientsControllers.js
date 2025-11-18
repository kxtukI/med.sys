import { Op } from 'sequelize';
import * as Yup from 'yup';
import { maskCpf, maskSus } from '../utils/maskUtils.js';
import { formatDateToDateOnly, formatDateOnlyToDisplay } from '../utils/dateUtils.js';
import { isValidCPF } from '../utils/documentUtils.js';
import Patient from '../models/Patients.js';
import User from '../models/Users.js';
import Appointments from '../models/Appointments.js';
import MedicalRecords from '../models/MedicalRecords.js';

class PatientsController {
  async index(req, res) {
    const { name, sus_number, cpf } = req.query;
    const { limit, offset } = req.pagination;

    const where = {};
    const userWhere = {};
    if (name) userWhere.name = { [Op.iLike]: `%${name}%` };
    if (sus_number) where.sus_number = { [Op.iLike]: `%${sus_number}%` };
    if (cpf) where.cpf = { [Op.iLike]: `%${cpf}%` };

    const data = await Patient.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'users',
          attributes: [['id', 'user_id'], 'name', 'email', 'user_type', 'active'],
          where: userWhere,
          required: true,
        },
      ],
      order: [
        [{ model: User, as: 'users' }, 'active', 'DESC'],
        [{ model: User, as: 'users' }, 'registration_date', 'DESC'],
      ],
      limit,
      offset,
      attributes: [['id', 'patient_id'], 'sus_number', 'cpf', 'birth_date'],
    });

    const maskedPatients = data.rows.map((patient) => ({
      ...patient.toJSON(),
      cpf: maskCpf(patient.cpf),
      sus_number: maskSus(patient.sus_number),
      birth_date: formatDateOnlyToDisplay(patient.birth_date),
    }));

    return res.json({
      data: maskedPatients,
      total: data.count,
      limit,
      page: offset / limit + 1,
      pages: Math.ceil(data.count / limit),
    });
  }

  async show(req, res) {
    const { id } = req.params;
    const currentUser = req.currentUser;
    
    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: { exclude: ['password_hash'] },
        },
      ],
    });
    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    if (currentUser && currentUser.user_type === 'patient') {
      if (String(patient.user_id) !== String(currentUser.id)) {
        return res.status(403).json({ error: 'Você só pode visualizar seus próprios dados' });
      }
    }

    const maskedPatient = {
      ...patient.toJSON(),
      cpf: maskCpf(patient.cpf),
      sus_number: maskSus(patient.sus_number),
      birth_date: formatDateOnlyToDisplay(patient.birth_date),
    };
    return res.json({ patient: maskedPatient });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string()
        .required('Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .matches(/^[\p{L}\p{M}\s'.-]+$/u, 'Nome deve conter apenas letras, espaços e alguns caracteres especiais'),
      cpf: Yup.string()
        .required('CPF é obrigatório')
        .length(11, 'CPF deve ter 11 dígitos')
        .matches(/^\d+$/, 'CPF deve conter apenas números')
        .test('cpf', 'CPF inválido', (value) => isValidCPF(value)),
      sus_number: Yup.string()
        .nullable()
        .transform((value) => (value === '' ? null : value))
        .matches(/^\d+$/, 'Número do SUS deve conter apenas números')
        .test('len', 'Número do SUS deve ter 15 dígitos', (val) => !val || val.length === 15),
      birth_date: Yup.date()
        .required('Data de nascimento é obrigatória')
        .max(new Date(), 'Data de nascimento não pode ser futura')
        .transform((value, originalValue) => {
          if (!originalValue) return null;
          if (value instanceof Date && !isNaN(value)) return value;
          const parts = originalValue.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) return date;
          }
          return null;
        }),
      phone: Yup.string()
        .required('Telefone é obrigatório')
        .matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      password: Yup.string()
        .required('Senha é obrigatória')
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .matches(
          /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
          'Senha deve conter pelo menos uma letra e um número'
        ),

      address: Yup.string().optional(),
      city: Yup.string().optional(),
      state: Yup.string().optional(),
      zip_code: Yup.string(8, 'O CEP deve ter 8 dígitos')
        .optional()
        .matches(/^\d+$/, 'O CEP deve conter apenas números'),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { name, cpf, sus_number, birth_date, phone, password } = req.body;
    let formattedBirthDate;
    try {
      formattedBirthDate = formatDateToDateOnly(birth_date);
    } catch (error) {
      return res.status(400).json({ error: 'Data de nascimento inválida', details: [error.message] });
    }

    const existingPatient = await Patient.findOne({ where: { cpf } });
    if (existingPatient) {
      return res.status(400).json({ error: 'Paciente com CPF ou número do SUS já cadastrado.' });
    }

    const user = await User.create({ name, password, phone, user_type: 'patient' });
    const patient = await Patient.create({ user_id: user.id, cpf, sus_number, birth_date: formattedBirthDate });

    return res.json({
      patient: {
        id: patient.id,
        name: user.name,
        cpf: maskCpf(patient.cpf),
        sus_number: patient.sus_number ? maskSus(patient.sus_number) : null,
        birth_date: formatDateOnlyToDisplay(patient.birth_date),
        phone: user.phone,
      },
    });
  }

  async update(req, res) {
    const currentUser = req.currentUser;
    const isPatient = currentUser && currentUser.user_type === 'patient';
    const isAdmin = currentUser && currentUser.user_type === 'admin';

    const schemaFields = {
      name: Yup.string().optional().min(3, 'Nome deve ter no mínimo 3 caracteres').matches(/^[\p{L}\p{M}\s'.-]+$/u, 'Nome deve conter apenas letras, espaços e alguns caracteres especiais'),
      email: Yup.string().optional().email('Email inválido'),
      phone: Yup.string().optional().matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
      password: Yup.string().optional().min(8, 'Senha deve ter no mínimo 8 caracteres').matches(/^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/, 'Senha deve conter pelo menos uma letra e um número'),
      address: Yup.string().optional(),
      city: Yup.string().optional(),
      state: Yup.string().optional(),
      zip_code: Yup.string(8, 'O CEP deve ter 8 dígitos').optional().matches(/^\d+$/, 'O CEP deve conter apenas números'),
    };

    if (isAdmin) {
      schemaFields.sus_number = Yup.string().optional().transform((value) => (value === '' ? null : value)).matches(/^\d+$/, 'Número do SUS deve conter apenas números').test('len', 'Número do SUS deve ter 15 dígitos', (val) => !val || val.length === 15);
      schemaFields.birth_date = Yup.date().optional().max(new Date(), 'Data de nascimento não pode ser futura').transform((value, originalValue) => {
        if (!originalValue) return null;
        if (value instanceof Date && !isNaN(value)) return value;
        const parts = originalValue.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) return date;
        }
        return null;
      });
    }

    const schema = Yup.object().shape(schemaFields);

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    if (isPatient) {
      delete req.body.sus_number;
      delete req.body.birth_date;
      delete req.body.cpf;
    }

    const { name, sus_number, birth_date, phone, password, email, address, city, state, zip_code } = req.body;
    let formattedBirthDate;
    if (birth_date) {
      try {
        formattedBirthDate = formatDateToDateOnly(birth_date);
      } catch (error) {
        return res.status(400).json({ error: 'Data de nascimento inválida', details: [error.message] });
      }
    }

    const id = req.params.id;
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }
    const user = await User.findByPk(patient.user_id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (phone !== undefined) userUpdates.phone = phone;
    if (email !== undefined) userUpdates.email = email;
    if (password !== undefined) userUpdates.password = password;
    
    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }

    const patientUpdates = {};
    if (address !== undefined) patientUpdates.address = address;
    if (city !== undefined) patientUpdates.city = city;
    if (state !== undefined) patientUpdates.state = state;
    if (zip_code !== undefined) patientUpdates.zip_code = zip_code;
    
    if (isAdmin) {
      if (sus_number !== undefined) patientUpdates.sus_number = sus_number;
      if (formattedBirthDate !== undefined) patientUpdates.birth_date = formattedBirthDate;
    }
    
    if (Object.keys(patientUpdates).length > 0) {
      await patient.update(patientUpdates);
    }

    const data = await Patient.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: { exclude: ['password_hash'] },
        },
      ],
    });
    const maskedPatient = {
      ...data.toJSON(),
      cpf: maskCpf(data.cpf),
      sus_number: maskSus(data.sus_number),
      birth_date: formatDateOnlyToDisplay(data.birth_date),
    };
    return res.json({ patient: maskedPatient });
  }

  async delete(req, res) {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }
    const patientUser = await User.findByPk(patient.user_id);
    await patientUser.update({ active: false });
    return res.json({ message: 'Paciente desativado com sucesso' });
  }

  async getMedicalHistory(req, res) {
    const { id } = req.params;
    const currentUser = req.currentUser;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID do paciente inválido' });
    }

    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Appointments,
          as: 'appointments',
          include: [
            {
              model: MedicalRecords,
              as: 'medical_records',
              attributes: [
                'id',
                'record_date',
                'observations',
                'prescribed_medications',
                'requested_exams',
                'disease_history',
                'allergies',
                'treatment_plan',
              ],
            },
          ],
          attributes: ['id', 'date_time', 'specialty', 'status'],
          order: [['date_time', 'DESC']],
        },
      ],
      attributes: ['id', 'cpf', 'sus_number', 'birth_date'],
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    if (currentUser && currentUser.user_type === 'patient') {
      if (String(patient.user_id) !== String(currentUser.id)) {
        return res.status(403).json({ error: 'Você só pode visualizar seu próprio histórico médico' });
      }
    }

    const formattedPatient = {
      ...patient.toJSON(),
      cpf: maskCpf(patient.cpf),
      sus_number: patient.sus_number ? maskSus(patient.sus_number) : null,
      birth_date: formatDateOnlyToDisplay(patient.birth_date),
      appointments: patient.appointments.map(appointment => ({
        ...appointment.toJSON(),
        date_time: formatDateOnlyToDisplay(appointment.date_time),
        medical_records: appointment.medical_records.map(record => ({
          ...record.toJSON(),
          record_date: formatDateOnlyToDisplay(record.record_date),
        })),
      })),
    };

    return res.json({
      patient: formattedPatient,
    });
  }

}

export default new PatientsController();
