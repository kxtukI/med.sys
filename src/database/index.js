import 'dotenv/config';
import Sequelize from 'sequelize';
import config from '../config/database.js';

import Users from '../app/models/Users.js';
import Patients from '../app/models/Patients.js';
import Professionals from '../app/models/Professionals.js';
import Appointments from '../app/models/Appointments.js';
import Medications from '../app/models/Medications.js';
import MedicationInventory from '../app/models/MedicationInventory.js';
import MedicationReservations from '../app/models/MedicationReservations.js';
import HealthUnits from '../app/models/HealthUnits.js';
import MedicalRecords from '../app/models/MedicalRecords.js';
import Referrals from '../app/models/Referrals.js';

const models = [
  Users,
  Patients,
  Professionals,
  Appointments,
  Medications,
  MedicationInventory,
  MedicationReservations,
  MedicalRecords,
  HealthUnits,
  Referrals,
];

class Database {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.connection = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        define: config.define,
      });
    } else {
      this.connection = new Sequelize(config.database, config.username, config.password, {
        host: config.host,
        dialect: config.dialect,
        define: config.define,
      });
    }

    this.init();
    this.associate();
  }

  init() {
    models.forEach((model) => model.init(this.connection));
  }

  associate() {
    models.forEach((model) => {
      if (model.associate) {
        model.associate(this.connection.models);
      }
    });
  }
}

export default new Database().connection;
