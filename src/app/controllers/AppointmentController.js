import * as Yup from 'yup';
import {
  startOfHour, parseISO, isBefore, subHours, format,
} from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async store(request, response) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      provider_id: Yup.number().required(),
    });
    if (!(await schema.isValid(request.body))) {
      return response.status(401).json({ error: 'Validation fails' });
    }
    const { date, provider_id } = request.body;
    if (provider_id === request.userId) {
      return response.status(401).json({ error: 'Você não pode criar agendamentos para sí próprio' });
    }
    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });
    if (!isProvider) {
      return response.status(401).json({ error: 'Voce não pode agendar com este provedor de serviços!' });
    }

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return response.status(401).json({ error: 'Data já passou, tente outra por favor!' });
    }

    const checkViabilitily = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkViabilitily) {
      return response.status(401).json({ error: 'Data fechada para gendamento' });
    }

    const appointments = await Appointment.create({
      user_id: request.userId,
      provider_id,
      canceled_at: null,
      date,
    });
    const { name } = await User.findByPk(request.userId);
    const formatedDate = format(hourStart,
      "EEEE 'dia' dd 'de' MMMM 'às' H:mm'h'", {
        locale: pt,
      });
    await Notification.create({
      content: `Novo agendamento de ${name} para ${formatedDate}`,
      user: provider_id,
    });

    return response.json(appointments);
  }

  async index(request, response) {
    const { page = 1 } = request.query;

    const appointments = await Appointment.findAll({
      where: {
        user_id: request.userId,
        canceled_at: null,
      },
      limit: 5,
      offset: (page - 1) * 5,
      attributes: ['id', 'date', 'past', 'cancelable'],
      include: [{
        model: User,
        as: 'provider',
        attributes: ['id', 'name', 'email'],
        include: [{
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        }],
      }],
    });

    return response.json(appointments);
  }

  async delete(request, response) {
    const { id } = request.params;

    const appointment = await Appointment.findByPk(id, {
      include: [{
        model: User,
        as: 'provider',
        attributes: ['name', 'email'],
      }, {
        model: User,
        as: 'user',
        attributes: ['name'],
      }],
    });

    if (!appointment) {
      return response.status(401).json({ error: 'Erro, agendamento não existe!' });
    }

    const subWithHour = subHours(appointment.date, 2);

    if (isBefore(subWithHour, new Date())) {
      return response.status(401).json({ error: 'Tempo de 2h para cancelamento excedido.' });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment,
    });

    return response.json(appointment);
  }
}
export default new AppointmentController();
