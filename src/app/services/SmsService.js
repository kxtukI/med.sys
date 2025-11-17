import twilio from 'twilio';
import Notifications from '../models/Notifications.js';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const fromNumber = process.env.TWILIO_FROM;

const client = twilio(accountSid, authToken);

function formatToE164(phoneNumber, countryCode = '55') {
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (digitsOnly.startsWith(countryCode)) {
    return `+${digitsOnly}`;
  }

  return `+${countryCode}${digitsOnly}`;
}

export default class SmsService {
  static async sendSms({ to, message, notificationData }) {
    let notification = null;
    try {
      if (!notificationData?.id) {
        notification = await Notifications.create({
          ...notificationData,
          channel: 'sms',
          message,
          status: 'pending',
          scheduled_for: notificationData?.scheduled_for || null
        });
    } else {
        notification = await Notifications.findByPk(notificationData.id);
      }

      const formattedTo = formatToE164(to); 

      await client.messages.create({
        body: message,
        from: fromNumber,
        to: formattedTo, 
      });
      await notification.update({ status: 'sent', sent_at: new Date() });
      return { success: true, notification };
    } catch (error) {
      if (notification) {
        await notification.update({ status: 'failed', error: error.message });
      }
      return { success: false, error: error.message, notification };
    }
  }
}
