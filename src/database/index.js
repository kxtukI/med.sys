import Sequelize from 'sequelize';
import config from '../config/database.js';

const models = [];

class Database {
    constructor() {
        this.connection = new Sequelize(
            config.database,
            config.username,
            config.password,
            {
                host: config.host,
                dialect: config.dialect,
                define: config.define,
            }
        );
        this.init();
        this.associate();
    }

    init() {
        models.forEach(model => model.init(this.connection));
    }

    associate() {
        models.forEach((model) => {
            if (model.associate) {
                model.associate(this.connection.models);
            }
        });
    }
}

export default new Database();