import * as Yup from 'yup';
import ProfessionalSchedules from '../models/ProfessionalSchedules.js';
import Professionals from '../models/Professionals.js';
import HealthUnits from '../models/HealthUnits.js';

const validateTimeFormat = (time) => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
};

const compareTime = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  return startTotalMin < endTotalMin;
};

class ProfessionalSchedulesController {

  async index(req, res) {
    try {
      const { professional_id, health_unit_id, day_of_week } = req.query;
      const { limit, offset } = req.pagination;

      const where = {};
      if (professional_id) where.professional_id = professional_id;
      if (health_unit_id) where.health_unit_id = health_unit_id;
      if (day_of_week !== undefined) where.day_of_week = day_of_week;

      const schedules = await ProfessionalSchedules.findAndCountAll({
        where,
        include: [
          {
            model: Professionals,
            as: 'professional',
            attributes: ['id', 'professional_register', 'specialty', 'status'],
            include: [
              {
                association: 'user',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: HealthUnits,
            as: 'health_unit',
            attributes: ['id', 'name', 'city', 'state'],
          },
        ],
        order: [
          ['health_unit_id', 'ASC'],
          ['professional_id', 'ASC'],
          ['day_of_week', 'ASC'],
        ],
        limit,
        offset,
      });

      return res.json({
        total: schedules.count,
        limit,
        offset,
        data: schedules.rows,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao listar horários',
        details: error.message,
      });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const schedule = await ProfessionalSchedules.findByPk(id, {
        include: [
          {
            model: Professionals,
            as: 'professional',
            attributes: ['id', 'professional_register', 'specialty'],
            include: [
              {
                association: 'user',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: HealthUnits,
            as: 'health_unit',
            attributes: ['id', 'name', 'address', 'city', 'state'],
          },
        ],
      });

      if (!schedule) {
        return res.status(404).json({
          error: 'Horário não encontrado',
        });
      }

      return res.json(schedule);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao buscar horário',
        details: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      const { professional_id, health_unit_id, day_of_week, start_time, end_time } = req.body;

      if (!start_time || !end_time) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: ['Horário inicial e horário final são obrigatórios'],
        });
      }

      const schema = Yup.object().shape({
        professional_id: Yup.number()
          .required('ID do profissional é obrigatório')
          .positive('ID do profissional deve ser positivo'),
        health_unit_id: Yup.number()
          .required('ID da UBS é obrigatório')
          .positive('ID da UBS deve ser positivo'),
        day_of_week: Yup.number()
          .required('Dia da semana é obrigatório')
          .min(0, 'Dia deve estar entre 0 e 6')
          .max(6, 'Dia deve estar entre 0 e 6'),
        start_time: Yup.string()
          .required('Horário inicial é obrigatório')
          .test('valid-time', 'Horário inicial deve estar no formato HH:MM', (value) =>
            validateTimeFormat(value)
          ),
        end_time: Yup.string()
          .required('Horário final é obrigatório')
          .test('valid-time', 'Horário final deve estar no formato HH:MM', (value) =>
            validateTimeFormat(value)
          ),
      });

      if (!(await schema.isValid(req.body))) {
        const validationErrors = await schema.validate(req.body, { abortEarly: false }).catch((err) => err.errors);
        return res.status(400).json({ error: 'Dados inválidos', details: validationErrors });
      }

      if (!compareTime(start_time, end_time)) {
        return res.status(400).json({
          error: 'Horário inicial deve ser menor que horário final',
        });
      }

      const professional = await Professionals.findByPk(professional_id);
      if (!professional) {
        return res.status(404).json({
          error: 'Profissional não encontrado',
        });
      }

      const healthUnit = await HealthUnits.findByPk(health_unit_id);
      if (!healthUnit) {
        return res.status(404).json({
          error: 'UBS não encontrada',
        });
      }

      const association = await professional.getHealth_units({
        where: { id: health_unit_id },
      });
      if (association.length === 0) {
        return res.status(400).json({
          error: 'Profissional não está associado a esta UBS',
        });
      }

      const existingSchedule = await ProfessionalSchedules.findOne({
        where: {
          professional_id,
          health_unit_id,
          day_of_week,
        },
      });

      if (existingSchedule) {
        return res.status(409).json({
          error: 'Já existe um horário cadastrado para este profissional, UBS e dia da semana',
        });
      }

      const schedule = await ProfessionalSchedules.create({
        professional_id,
        health_unit_id,
        day_of_week,
        startTime: start_time,
        endTime: end_time,
      });

      const createdSchedule = await ProfessionalSchedules.findByPk(schedule.id, {
        include: [
          {
            model: Professionals,
            as: 'professional',
            attributes: ['id', 'professional_register', 'specialty'],
            include: [
              {
                association: 'user',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: HealthUnits,
            as: 'health_unit',
            attributes: ['id', 'name', 'address', 'city', 'state'],
          },
        ],
      });

      return res.status(201).json(createdSchedule.toJSON());
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao criar horário',
        details: error.message,
      });
    }
  }

  async createBulk(req, res) {
    try {
      const { professional_id, health_unit_id, schedules } = req.body;

      if (!Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({
          error: 'Lista de horários deve ser um array não vazio',
        });
      }

      const professional = await Professionals.findByPk(professional_id);
      if (!professional) {
        return res.status(404).json({
          error: 'Profissional não encontrado',
        });
      }

      const healthUnit = await HealthUnits.findByPk(health_unit_id);
      if (!healthUnit) {
        return res.status(404).json({
          error: 'UBS não encontrada',
        });
      }

      const association = await professional.getHealth_units({
        where: { id: health_unit_id },
      });
      if (association.length === 0) {
        return res.status(400).json({
          error: 'Profissional não está associado a esta UBS',
        });
      }

      const results = {
        added: [],
        failed: [],
      };

      for (let i = 0; i < schedules.length; i++) {
        const { dayOfWeek, startTime, endTime } = schedules[i];

        if (!startTime || !endTime) {
          results.failed.push({
            index: i,
            dayOfWeek,
            startTime,
            endTime,
            error: 'Horário inicial e horário final são obrigatórios',
          });
          continue;
        }

        const schema = Yup.object().shape({
          dayOfWeek: Yup.number()
            .required('Dia da semana é obrigatório')
            .min(0, 'Dia deve estar entre 0 e 6')
            .max(6, 'Dia deve estar entre 0 e 6'),
          startTime: Yup.string()
            .required('Horário inicial é obrigatório')
            .test('valid-time', 'Horário inicial deve estar no formato HH:MM', (value) =>
              validateTimeFormat(value)
            ),
          endTime: Yup.string()
            .required('Horário final é obrigatório')
            .test('valid-time', 'Horário final deve estar no formato HH:MM', (value) =>
              validateTimeFormat(value)
            ),
        });

        try {
          await schema.validate({ dayOfWeek, startTime, endTime }, { abortEarly: false });

          if (!compareTime(startTime, endTime)) {
            results.failed.push({
              index: i,
              dayOfWeek,
              startTime,
              endTime,
              error: 'Horário inicial deve ser menor que horário final',
            });
            continue;
          }

          const existingSchedule = await ProfessionalSchedules.findOne({
            where: {
              professional_id,
              health_unit_id,
              day_of_week: dayOfWeek,
            },
          });

          if (existingSchedule) {
            results.failed.push({
              index: i,
              dayOfWeek,
              startTime,
              endTime,
              error: 'Já existe um horário cadastrado para este dia',
            });
            continue;
          }

          const schedule = await ProfessionalSchedules.create({
            professional_id,
            health_unit_id,
            day_of_week: dayOfWeek,
            startTime,
            endTime,
          });

          results.added.push({
            index: i,
            dayOfWeek,
            startTime,
            endTime,
            data: schedule,
          });
        } catch (validationError) {
          results.failed.push({
            index: i,
            dayOfWeek,
            startTime,
            endTime,
            error: validationError.message,
          });
        }
      }

      return res.status(201).json({
        message: `${results.added.length} horário(s) adicionado(s), ${results.failed.length} erro(s)`,
        data: results,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao criar horários',
        details: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { start_time, end_time } = req.body;

      const schedule = await ProfessionalSchedules.findByPk(id);
      if (!schedule) {
        return res.status(404).json({
          error: 'Horário não encontrado',
        });
      }

      if (start_time === undefined && end_time === undefined) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: ['Envie pelo menos start_time ou end_time para atualizar'],
        });
      }

      const startTime = start_time !== undefined ? start_time : schedule.start_time;
      const endTime = end_time !== undefined ? end_time : schedule.end_time;

      if (!startTime || !endTime) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: ['Horário inicial e horário final não podem ser vazios'],
        });
      }

      if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
        return res.status(400).json({
          error: 'Horários devem estar no formato HH:MM',
        });
      }

      if (!compareTime(startTime, endTime)) {
        return res.status(400).json({
          error: 'Horário inicial deve ser menor que horário final',
        });
      }

      const updateData = {};
      if (start_time !== undefined) updateData.startTime = startTime;
      if (end_time !== undefined) updateData.endTime = endTime;

      await schedule.update(updateData);

      return res.json(schedule);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao atualizar horário',
        details: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const schedule = await ProfessionalSchedules.findByPk(id);
      if (!schedule) {
        return res.status(404).json({
          error: 'Horário não encontrado',
        });
      }

      await schedule.destroy();

      return res.json({
        message: 'Horário removido com sucesso',
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao remover horário',
        details: error.message,
      });
    }
  }

  async getByProfessionalAndHealthUnit(req, res) {
    try {
      const { professional_id, health_unit_id } = req.params;

      const schedules = await ProfessionalSchedules.findAll({
        where: {
          professional_id,
          health_unit_id,
        },
        include: [
          {
            model: Professionals,
            as: 'professional',
            attributes: ['id', 'professional_register', 'specialty'],
          },
          {
            model: HealthUnits,
            as: 'health_unit',
            attributes: ['id', 'name', 'city'],
          },
        ],
        order: [['day_of_week', 'ASC']],
      });

      return res.json(schedules);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao buscar horários',
        details: error.message,
      });
    }
  }

  async getByHealthUnit(req, res) {
    try {
      const { health_unit_id } = req.params;
      const { limit, offset } = req.pagination;

      const schedules = await ProfessionalSchedules.findAndCountAll({
        where: { health_unit_id },
        include: [
          {
            model: Professionals,
            as: 'professional',
            attributes: ['id', 'professional_register', 'specialty'],
            include: [
              {
                association: 'user',
                attributes: ['id', 'name', 'email'],
              },
            ],
          },
          {
            model: HealthUnits,
            as: 'health_unit',
            attributes: ['id', 'name'],
          },
        ],
        order: [
          ['professional_id', 'ASC'],
          ['day_of_week', 'ASC'],
        ],
        limit,
        offset,
      });

      return res.json({
        total: schedules.count,
        limit,
        offset,
        data: schedules.rows,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao buscar horários da UBS',
        details: error.message,
      });
    }
  }
}

export default new ProfessionalSchedulesController();
