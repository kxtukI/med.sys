import AppointmentSlotService from '../services/AppointmentSlotService.js';

class AppointmentSlotsController {
    async getSlotsByDate(req, res) {
        try {
            const { professional_id, health_unit_id, date } = req.params;

            if (!professional_id || !health_unit_id || !date) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    details: ['professional_id, health_unit_id e date são obrigatórios'],
                });
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    error: 'Data inválida',
                    details: ['Use formato YYYY-MM-DD'],
                });
            }

            const result = await AppointmentSlotService.generateAvailableSlots(
                Number(professional_id),
                Number(health_unit_id),
                date
            );

            if (!result.success) {
                return res.status(404).json({
                    error: result.error,
                });
            }

            const [year, month, day] = date.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            const dayOfWeek = localDate.getDay();

            return res.json({
                date: date,
                professional_id: Number(professional_id),
                health_unit_id: Number(health_unit_id),
                day_of_week: dayOfWeek,
                slots: result.slots,
                summary: {
                    total: result.total,
                    available: result.available_count,
                    booked: result.booked_count,
                },
            });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao buscar vagas',
                details: error.message,
            });
        }
    }

    async getNextAvailableDays(req, res) {
        try {
            const { professional_id, health_unit_id } = req.params;
            const { days = 30 } = req.query;

            if (!professional_id || !health_unit_id) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    details: ['professional_id e health_unit_id são obrigatórios'],
                });
            }

            const result = await AppointmentSlotService.getAvailableDays(
                Number(professional_id),
                Number(health_unit_id),
                Math.min(Number(days), 90)
            );

            if (!result.success) {
                return res.status(500).json({
                    error: result.error,
                });
            }

            return res.json({
                professional_id: Number(professional_id),
                health_unit_id: Number(health_unit_id),
                available_days: result.days,
                total_days_with_availability: result.days.length,
            });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao buscar dias disponíveis',
                details: error.message,
            });
        }
    }

    async validateSlot(req, res) {
        try {
            const { professional_id, health_unit_id, date, time } = req.params;

            if (!professional_id || !health_unit_id || !date || !time) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    details: ['professional_id, health_unit_id, date e time são obrigatórios'],
                });
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    error: 'Data inválida',
                    details: ['Use formato YYYY-MM-DD'],
                });
            }

            const result = await AppointmentSlotService.validateSlot(
                Number(professional_id),
                Number(health_unit_id),
                date,
                time
            );

            if (!result.valid) {
                return res.status(409).json({
                    error: 'Horário indisponível',
                    details: result.message,
                });
            }

            return res.json({
                valid: true,
                message: 'Horário disponível',
                slot: result.slot,
            });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao validar vaga',
                details: error.message,
            });
        }
    }
}

export default new AppointmentSlotsController();

