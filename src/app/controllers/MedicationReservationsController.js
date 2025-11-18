import { Op } from 'sequelize';
import * as Yup from 'yup';
import { injectUserResourceId } from '../utils/authUtils.js';

import MedicationReservation from '../models/MedicationReservations.js';
import MedicationInventory from '../models/MedicationInventory.js';
import Medication from '../models/Medications.js';
import HealthUnit from '../models/HealthUnits.js';
import Patient from '../models/Patients.js';
import User from '../models/Users.js';
import sequelize from '../../database/index.js';

const RESERVATION_STATUSES = ['reserved', 'ready', 'picked_up', 'canceled', 'expired'];

const reservationIncludes = [
  {
    model: Medication,
    as: 'medication',
    attributes: ['id', 'name', 'active_ingredient', 'category', 'manufacturer'],
  },
  {
    model: HealthUnit,
    as: 'healthUnit',
    attributes: ['id', 'name', 'city', 'state'],
  },
  {
    model: Patient,
    as: 'patient',
    attributes: ['id', 'user_id', 'cpf', 'sus_number'],
    include: [
      {
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email', 'phone'],
      },
    ],
  },
];

const findPatientByUserId = async (userId) => {
  if (!userId) return null;
  return Patient.findOne({ where: { user_id: userId } });
};

class MedicationReservationsController {
  async index(req, res) {
    const { limit, offset } = req.pagination;
    const { medication_id, health_unit_id, status, patient_id, from, to } = req.query;

    const where = {};

    if (medication_id) where.medication_id = parseInt(medication_id, 10);
    if (health_unit_id) where.health_unit_id = parseInt(health_unit_id, 10);
    if (status) {
      if (!RESERVATION_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      where.status = status;
    }

    if (from || to) {
      where.reserved_at = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({ error: 'Data inicial inválida' });
        }
        where.reserved_at[Op.gte] = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({ error: 'Data final inválida' });
        }
        where.reserved_at[Op.lte] = toDate;
      }
    }

    const currentUser = req.currentUser;

    if (currentUser.user_type === 'patient') {
      const patient = await findPatientByUserId(currentUser.id);
      if (!patient) {
        return res.status(404).json({ error: 'Paciente não encontrado para este usuário' });
      }
      where.patient_id = patient.id;
    } else if (patient_id) {
      where.patient_id = parseInt(patient_id, 10);
    }

    const data = await MedicationReservation.findAndCountAll({
      where,
      include: reservationIncludes,
      order: [['reserved_at', 'DESC']],
      limit,
      offset,
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
    const reservation = await MedicationReservation.findByPk(id, {
      include: reservationIncludes,
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const currentUser = req.currentUser;
    if (currentUser.user_type === 'patient') {
      const patient = await findPatientByUserId(currentUser.id);
      if (!patient || reservation.patient_id !== patient.id) {
        return res.status(403).json({ error: 'Você não pode acessar esta reserva' });
      }
    }

    return res.json({ reservation });
  }

  async create(req, res) {
    const schema = Yup.object().shape({
      medication_id: Yup.number().required('ID do medicamento é obrigatório'),
      health_unit_id: Yup.number().required('ID da unidade de saúde é obrigatório'),
      quantity: Yup.number().required('Quantidade é obrigatória').integer('Quantidade deve ser um número inteiro').min(1, 'Quantidade mínima é 1'),
      scheduled_pickup_at: Yup.date()
        .typeError('Horário de retirada inválido')
        .required('Horário de retirada é obrigatório')
        .transform((value, originalValue) => (originalValue ? value : null)),
      notes: Yup.string().max(500, 'Notas devem ter no máximo 500 caracteres').nullable(),
      patient_id: Yup.number().nullable(), 
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const currentUser = req.currentUser;
    const { medication_id, health_unit_id, quantity, scheduled_pickup_at, notes } = req.body;
    let patientId = req.body.patient_id;

    if (currentUser.user_type === 'patient') {
      const patient = await findPatientByUserId(currentUser.id);
      if (!patient) {
        return res.status(404).json({ error: 'Paciente não encontrado para este usuário' });
      }
      patientId = patient.id;
    } else {
      if (!patientId) {
        return res.status(400).json({ error: 'ID do paciente é obrigatório para profissionais ou admins' });
      }
    }

    const scheduledPickupDate = new Date(scheduled_pickup_at);
    const inventory = await MedicationInventory.findOne({
      where: { medication_id, health_unit_id },
    });

    if (!inventory || inventory.available_quantity < quantity) {
      return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
    }

    const reservation = await MedicationReservation.create({
      patient_id: patientId,
      medication_id,
      health_unit_id,
      quantity,
      scheduled_pickup_at: scheduledPickupDate,
      notes,
      status: 'reserved',
    });

    await inventory.decrement('available_quantity', { by: quantity });

    const createdReservation = await MedicationReservation.findByPk(reservation.id, {
      include: reservationIncludes,
    });

    return res.status(201).json({ reservation: createdReservation });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      status: Yup.string().oneOf(RESERVATION_STATUSES).optional(),
      scheduled_pickup_at: Yup.date()
        .typeError('Horário de retirada inválido')
        .nullable()
        .transform((value, originalValue) => (originalValue === '' ? null : value)),
      notes: Yup.string().max(500, 'Notas devem ter no máximo 500 caracteres').nullable(),
    });

    if (!(await schema.isValid(req.body))) {
      const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
      return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
    }

    const { id } = req.params;
    const currentUser = req.currentUser;
    let reservation = await MedicationReservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    if (currentUser.user_type === 'patient') {
      const patient = await findPatientByUserId(currentUser.id);
      if (!patient || reservation.patient_id !== patient.id) {
        return res.status(403).json({ error: 'Você não pode alterar esta reserva' });
      }
    }

    const { status, scheduled_pickup_at, notes } = req.body;

    let scheduledPickupDate;
    if (scheduled_pickup_at !== undefined) {
      if (scheduled_pickup_at === null) {
        return res.status(400).json({ error: 'Horário de retirada não pode ser nulo' });
      }

      scheduledPickupDate = new Date(scheduled_pickup_at);
      if (Number.isNaN(scheduledPickupDate.getTime())) {
        return res.status(400).json({ error: 'Horário de retirada inválido' });
      }

      if (scheduledPickupDate.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Horário de retirada deve ser posterior ao horário atual' });
      }
    }

    if (!status && scheduled_pickup_at === undefined && notes === undefined) {
      return res.status(400).json({ error: 'Nenhuma alteração informada' });
    }

    const transaction = await sequelize.transaction();

    try {
      await reservation.reload({ transaction, lock: transaction.LOCK.UPDATE });

      const updates = {};

      if (scheduled_pickup_at !== undefined) {
        updates.scheduled_pickup_at = scheduledPickupDate;
      }

      if (notes !== undefined) {
        updates.notes = notes || null;
      }

      let restockInventory = false;

      if (status && status !== reservation.status) {
        if (currentUser.user_type === 'patient' && status !== 'canceled') {
          await transaction.rollback();
          return res.status(403).json({ error: 'Você não tem permissão para alterar o status para este valor' });
        }

        if (reservation.status === 'canceled' || reservation.status === 'expired') {
          await transaction.rollback();
          return res.status(409).json({ error: `Não é possível alterar uma reserva com status '${reservation.status}'` });
        }

        if (status === 'canceled') {
          restockInventory = true;
          updates.status = 'canceled';
          updates.picked_up_at = null;
        } else if (status === 'picked_up') {
          updates.status = 'picked_up';
          updates.picked_up_at = new Date();
        } else if (status === 'expired') {
          restockInventory = true;
          updates.status = 'expired';
          updates.picked_up_at = null;
        } else {
          updates.status = status;
        }
      }

      if (Object.keys(updates).length === 0 && !restockInventory) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Nenhuma alteração válida foi informada' });
      }

      await reservation.update(updates, { transaction });

      if (restockInventory) {
        const inventory = await MedicationInventory.findOne({
          where: {
            medication_id: reservation.medication_id,
            health_unit_id: reservation.health_unit_id,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!inventory) {
          await transaction.rollback();
          return res.status(500).json({ error: 'Estoque não encontrado para reajuste da reserva' });
        }

        await inventory.update(
          {
            available_quantity: inventory.available_quantity + reservation.quantity,
            update_date: new Date(),
          },
          { transaction }
        );
      }

      await transaction.commit();

      reservation = await MedicationReservation.findByPk(id, { include: reservationIncludes });

      return res.json({ reservation });
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Falha ao atualizar a reserva', details: error.message });
    }
  }

  async delete(req, res) {
    const { id } = req.params;
    const currentUser = req.currentUser;

    let reservation = await MedicationReservation.findByPk(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    if (currentUser.user_type === 'patient') {
      const patient = await findPatientByUserId(currentUser.id);
      if (!patient || reservation.patient_id !== patient.id) {
        return res.status(403).json({ error: 'Você não pode cancelar esta reserva' });
      }
    }

    if (reservation.status === 'canceled') {
      await reservation.reload({ include: reservationIncludes });
      return res.json({ message: 'Reserva já cancelada', reservation });
    }

    if (reservation.status === 'picked_up') {
      return res.status(409).json({ error: 'Não é possível cancelar uma reserva já retirada' });
    }

    const transaction = await sequelize.transaction();

    try {
      await reservation.reload({ transaction, lock: transaction.LOCK.UPDATE });

      if (reservation.status === 'picked_up') {
        await transaction.rollback();
        return res.status(409).json({ error: 'Não é possível cancelar uma reserva já retirada' });
      }

      const inventory = await MedicationInventory.findOne({
        where: {
          medication_id: reservation.medication_id,
          health_unit_id: reservation.health_unit_id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!inventory) {
        await transaction.rollback();
        return res.status(500).json({ error: 'Estoque não encontrado para reajuste da reserva' });
      }

      await inventory.update(
        {
          available_quantity: inventory.available_quantity + reservation.quantity,
          update_date: new Date(),
        },
        { transaction }
      );

      await reservation.update({ status: 'canceled', picked_up_at: null }, { transaction });

      await transaction.commit();

      reservation = await MedicationReservation.findByPk(id, { include: reservationIncludes });

      return res.json({ message: 'Reserva cancelada com sucesso', reservation });
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json({ error: 'Falha ao cancelar a reserva', details: error.message });
    }
  }
}

export default new MedicationReservationsController();

