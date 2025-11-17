import cron from 'node-cron';
import { processPendingNotifications } from './NotificationJobService.js';
import { processLateAppointments } from './LateAppointmentJobService.js';

export function startScheduler() {
    cron.schedule('*/5 * * * *', () => {
        console.log('Executando job de notificações pendentes...');
        processPendingNotifications().catch(console.error);
    });

    cron.schedule('*/15 * * * *', () => {
        console.log('Executando job de agendamentos atrasados...');
        processLateAppointments().catch(console.error);
    });
}