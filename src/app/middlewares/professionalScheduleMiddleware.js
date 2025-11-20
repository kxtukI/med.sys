import ProfessionalSchedules from '../models/ProfessionalSchedules.js';
import ProfessionalHealthUnits from '../models/ProfessionalHealthUnits.js';

const checkProfessionalScheduleAccess = async (req, res, next) => {
  try {
    const { professional_id, health_unit_id } = req.body;

    if (!professional_id || !health_unit_id) {
      return res.status(400).json({
        error: 'ID do profissional e ID da UBS são obrigatórios',
      });
    }

    const association = await ProfessionalHealthUnits.findOne({
      where: {
        professional_id,
        health_unit_id,
      },
    });

    if (!association) {
      return res.status(403).json({
        error: 'Profissional não está associado a esta UBS',
      });
    }

    if (req.method === 'PUT' || req.method === 'DELETE') {
      const { id } = req.params;
      const schedule = await ProfessionalSchedules.findByPk(id);

      if (!schedule) {
        return res.status(404).json({
          error: 'Horário não encontrado',
        });
      }

      if (schedule.professional_id !== Number(professional_id) ||
          schedule.health_unit_id !== Number(health_unit_id)) {
        return res.status(403).json({
          error: 'Acesso negado. Horário não pertence a este profissional nesta UBS',
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao validar acesso ao horário',
      details: error.message,
    });
  }
};

export default checkProfessionalScheduleAccess;
