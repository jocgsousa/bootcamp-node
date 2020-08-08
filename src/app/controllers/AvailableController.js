import {
  startOfDay, endOfDay, setHours, setMinutes, setSeconds, format, isAfter,
} from 'date-fns';
import { Op } from 'sequelize';
import User from '../models/User';
import Appointment from '../models/Appointment';

class AvailableController {
  async index(request, response) {
    const ispProvider = await User.findOne({
      where: {
        id: request.params.providerId,
        provider: true,
      },
    });
    if (!ispProvider) {
      return response.status(401).json({ error: 'You is not provider!' });
    }

    // Recepetde date query
    const { date } = request.query;
    if (!date) {
      return response.status(401).json({ error: 'Date invalid' });
    }
    const searchDate = Number(date);

    const appointment = await Appointment.findAll({
      where: {
        provider_id: request.params.providerId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });

    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
    ];

    const available = schedule.map((time) => {
      const [hour, minute] = time.split(':');
      const value = setSeconds(setMinutes(setHours(searchDate, hour), minute), 0);

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available: isAfter(value, new Date())
        && !appointment.find((a) => format(a.date, 'HH:mm') === time),
      };
    });

    return response.json(available);
  }
}
export default new AvailableController();
