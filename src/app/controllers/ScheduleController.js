import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

class ScheduleController {
  async index(request, response) {
    const userIsProvider = await User.findOne({
      where: {
        id: request.userId,
        provider: true,
      },
    });
    if (!userIsProvider) {
      return response.status(401).json({ error: 'Acesso somente para provedores de serviços' });
    }

    const appointments = await Appointment.findAll({
      where: {
        provider_id: request.userId,
        canceled_at: null,
      },
      attributes: ['id', 'date'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name'],
        include: [{
          model: File,
          as: 'avatar',
        }],
      }],
    });
    return response.json(appointments);
  }
}
export default new ScheduleController();
