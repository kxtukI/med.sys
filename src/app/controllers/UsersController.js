import { Op } from 'sequelize';

import User from '../models/Users.js';

class UsersController {
  async index(req, res) {
    const { limit, offset } = req.pagination;

    const data = await User.findAndCountAll({
      limit,
      offset,
      order: [['registration_date', 'DESC']],
      attributes: { exclude: ['password_hash'] },
    });

    return res.json({
      data: data.rows,
      total: data.count,
      limit,
      page: offset / limit + 1,
      pages: Math.ceil(data.count / limit),
    });
  }

  async show(req, res) {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
    });
    return res.json({ user });
  }

  async update(req, res) {
    const { id } = req.params;
    const user = await User.findByPk(id);
    await user.update(req.body);
    return res.json({ user });
  }

  async delete(req, res) {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    return res.json({ message: 'Usuário deletado com sucesso' });
  }
}

export default new UsersController();
