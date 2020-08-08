import Notification from '../schemas/Notification';
import User from '../models/User';

class NotificationController {
  async index(request, response) {
    const isProvider = await User.findOne({
      where: {
        id: request.userId,
        provider: true,
      },
    });
    if (!isProvider) {
      return response.statu(401).json({ error: 'Is not as provider!' });
    }

    const appointments = await Notification.find({
      user: request.userId,
    }).sort({ createdAt: 'DESC' }).limit(20);

    return response.json(appointments);
  }

  async update(request, response) {
    const { id } = request.params;

    const notification = await Notification.findByIdAndUpdate(id,
      { read: true },
      { new: true });

    return response.json(notification);
  }
}
export default new NotificationController();
