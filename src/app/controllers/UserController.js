import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().min(6).required(),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(401).json({ error: 'Valitadion fails' });
    }
    const userExists = await User.findOne({
      where: { email: request.body.email },
    });
    if (userExists) {
      return response.status(400).json({ error: 'Conta de e-mail já cadstrada' });
    }

    const { id, name, email } = await User.create(request.body);

    return response.json({
      id,
      name,
      email,
    });
  }

  async update(request, response) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldpassword: Yup.string().min(6),
      password: Yup.string().min(6).when('oldpassword', (oldpassword, field) => (oldpassword ? field.required() : field)),
      confirmPassword: Yup.string().min(6).when('password', (password, field) => (password ? field.required().oneOf([Yup.ref('password')]) : field)),
    });

    if (!(await schema.isValid(request.body))) {
      return response.status(401).json({ error: 'Valitadion fails' });
    }

    const { email, oldpassword } = request.body;

    const user = await User.findByPk(request.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({
        where: {
          email,
        },
      });
      if (userExists) {
        return response.status(401).json({ error: 'Este e-mail já esta em uso!' });
      }
    }

    if (oldpassword && !(await user.checkPassword(oldpassword))) {
      return response.status(401).json({ error: 'Senha inválida' });
    }
    const { id, name } = await user.update(request.body);

    return response.json({
      id,
      name,
      email,
    });
  }
}
export default new UserController();
