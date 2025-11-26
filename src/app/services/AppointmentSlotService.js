import ProfessionalSchedules from '../models/ProfessionalSchedules.js';
import Appointments from '../models/Appointments.js';
import { Op } from 'sequelize';

class AppointmentSlotService {
    static timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    static minutesToTime(minutes) {
        const num = Math.floor(Number(minutes));
        const h = Math.floor(num / 60);
        const m = num % 60;
        const hoursStr = String(h);
        const minsStr = String(m);
        const paddedH = hoursStr.length === 1 ? '0' + hoursStr : hoursStr;
        const paddedM = minsStr.length === 1 ? '0' + minsStr : minsStr;
        const result = paddedH + ':' + paddedM;
        return result;
    }

    static async generateAvailableSlots(professionalId, healthUnitId, appointmentDate) {
        try {
            let dateStr;
            let dayOfWeek;

            if (typeof appointmentDate === 'string') {
                dateStr = appointmentDate;
            } else if (appointmentDate instanceof Date) {
                dateStr = appointmentDate.toISOString().split('T')[0];
            } else {
                throw new Error('appointmentDate must be a string (YYYY-MM-DD) or Date object');
            }

            const [year, month, day] = dateStr.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            dayOfWeek = localDate.getDay();

            const schedule = await ProfessionalSchedules.findOne({
                where: {
                    professional_id: professionalId,
                    health_unit_id: healthUnitId,
                    day_of_week: dayOfWeek,
                },
                attributes: { include: ['start_time', 'end_time'] }
            });

            if (!schedule) {
                return {
                    success: false,
                    error: 'Profissional não tem horário disponível neste dia',
                    slots: [],
                };
            }

            const scheduleData = schedule.toJSON();

            const startTime = scheduleData.startTime;
            const endTime = scheduleData.endTime;

            if (!startTime || !endTime) {
                return {
                    success: false,
                    error: 'Horário não configurado corretamente',
                    slots: [],
                };
            }

            const startMinutes = this.timeToMinutes(startTime);
            const endMinutes = this.timeToMinutes(endTime);
            const duration = scheduleData.slotDurationMinutes || scheduleData.durationMinutes || 20;
            const buffer = scheduleData.bufferMinutes || 10;
            const totalSlotDuration = duration + buffer;

            let slots = [];
            let currentMinutes = startMinutes;

            while (currentMinutes + duration <= endMinutes) {
                const slotStart = this.minutesToTime(currentMinutes);
                const slotEnd = this.minutesToTime(currentMinutes + duration);

                slots.push({
                    start_time: slotStart,
                    end_time: slotEnd,
                    start_minutes: currentMinutes,
                    end_minutes: currentMinutes + duration,
                });

                currentMinutes += totalSlotDuration;
            }

            const breakStartTime = scheduleData.breakStartTime;
            const breakEndTime = scheduleData.breakEndTime;

            if (breakStartTime && breakEndTime) {
                const breakStartMinutes = this.timeToMinutes(breakStartTime);
                const breakEndMinutes = this.timeToMinutes(breakEndTime);

                slots = slots.filter(slot => {
                    return !(slot.start_minutes < breakEndMinutes && slot.end_minutes > breakStartMinutes);
                });
            }

            const parts = dateStr.split('-');
            const startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const endDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const bookedAppointments = await Appointments.findAll({
                where: {
                    professional_id: professionalId,
                    health_unit_id: healthUnitId,
                    date_time: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    },
                    status: { [Op.ne]: 'canceled' },
                },
                raw: true,
            });

            const availableSlots = slots.map(slot => {
                try {
                    if (!slot.start_time || !slot.end_time) {
                        console.error('Slot sem start_time ou end_time:', JSON.stringify(slot));
                        return {
                            ...slot,
                            available: true,
                            booked_appointment_id: null,
                        };
                    }

                    const parts = dateStr.split('-');
                    const slotDateTime = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

                    const timeParts = slot.start_time.split(':');
                    const slotHours = parseInt(timeParts[0], 10);
                    const slotMins = parseInt(timeParts[1], 10);
                    slotDateTime.setHours(slotHours, slotMins, 0, 0);

                    const isBooked = bookedAppointments.some(apt => {
                        return new Date(apt.date_time).getTime() === slotDateTime.getTime();
                    });

                    return {
                        ...slot,
                        available: !isBooked,
                        booked_appointment_id: isBooked ? bookedAppointments.find(apt => new Date(apt.date_time).getTime() === slotDateTime.getTime())?.id : null,
                    };
                } catch (err) {
                    console.error('Erro ao processar slot:', JSON.stringify(slot), err.message);
                    return {
                        ...slot,
                        available: true,
                        booked_appointment_id: null,
                    };
                }
            });

            return {
                success: true,
                slots: availableSlots,
                total: availableSlots.length,
                available_count: availableSlots.filter(s => s.available).length,
                booked_count: availableSlots.filter(s => !s.available).length,
            };
        } catch (error) {
            console.error('Erro ao gerar vagas:', error.message);
            return {
                success: false,
                error: error.message,
                slots: [],
            };
        }
    }

    static async validateSlot(professionalId, healthUnitId, appointmentDate, slotTime) {
        try {
            const result = await this.generateAvailableSlots(professionalId, healthUnitId, appointmentDate);

            if (!result.success) {
                return {
                    valid: false,
                    message: result.error,
                };
            }

            const slot = result.slots.find(s => s.start_time === slotTime);

            if (!slot) {
                return {
                    valid: false,
                    message: 'Horário solicitado não é uma vaga válida neste dia',
                };
            }

            if (!slot.available) {
                return {
                    valid: false,
                    message: 'Vaga já foi ocupada',
                };
            }

            return {
                valid: true,
                slot: slot,
            };
        } catch (error) {
            return {
                valid: false,
                message: error.message,
            };
        }
    }

    static async getAvailableDays(professionalId, healthUnitId, daysToCheck = 30) {
        try {
            const availableDays = [];
            const today = new Date();

            for (let i = 0; i < daysToCheck; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() + i);

                const result = await this.generateAvailableSlots(professionalId, healthUnitId, checkDate);

                if (result.success && result.available_count > 0) {
                    availableDays.push({
                        date: checkDate.toISOString().split('T')[0],
                        day_of_week: checkDate.getDay(),
                        available_slots: result.available_count,
                        total_slots: result.total,
                    });
                }
            }

            return {
                success: true,
                days: availableDays,
                total_days_checked: daysToCheck,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                days: [],
            };
        }
    }
}

export default AppointmentSlotService;

