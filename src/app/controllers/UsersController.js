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

}

export default new UsersController();
