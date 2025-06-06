import { Op } from 'sequelize';
import * as Yup from 'yup';
import { maskCpf, maskSus } from '../utils/maskUtils.js';
import { formatDateToDateOnly, formatDateOnlyToDisplay } from '../utils/dateUtils.js';
import { isValidCPF } from '../utils/documentUtils.js';

import Patient from '../models/Patients.js';
import User from '../models/Users.js';

class PatientsController {
  async index(req, res) {
    const { limit, offset } = req.pagination;
    const data = await Patient.findAndCountAll({
      include: [
        {
          model: User,
          as: 'users',
          attributes: [['id', 'user_id'], 'name', 'email', 'user_type', 'active'],
          order: [['registration_date', 'DESC']],
        },
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

  async create(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string()
        .required('Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .matches(/^[a-zA-Z\s]+$/, 'Nome deve conter apenas letras'),

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
          if (value instanceof Date && !isNaN(value)) {
            return value;
          }
          const parts = originalValue.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              return date;
            }
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
          /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
          'Senha deve conter pelo menos uma letra e um número'
        ),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema
        .validate(req.body, { abortEarly: false })
        .catch((err) => err.errors);

      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationErrors,
      });
    }

    const { name, cpf, sus_number, birth_date, phone, password } = req.body;

    let formattedBirthDate;
    try {
      formattedBirthDate = formatDateToDateOnly(birth_date);
    } catch (error) {
      return res.status(400).json({
        error: 'Data de nascimento inválida',
        details: [error.message],
      });
    }

    const existingPatient = await Patient.findOne({
      where: {
        cpf: cpf,
      },
    });

    if (existingPatient) {
      return res.status(400).json({ error: 'Paciente com CPF ou número do SUS já cadastrado.' });
    }

    const user = await User.create({
      name,
      password,
      phone,
    });

    const patient = await Patient.create({
      user_id: user.id,
      cpf,
      sus_number,
      birth_date: formattedBirthDate,
    });

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
    const id = req.params.id;

    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }
  }
}

export default new PatientsController();
