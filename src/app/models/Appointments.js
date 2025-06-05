import { Model, DataTypes } from 'sequelize';

class Appointments extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        patient_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'patients',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        professional_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'professionals',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        health_unit_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'health_units',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        date_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        specialty: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('scheduled', 'canceled', 'completed'),
          allowNull: false,
          defaultValue: 'scheduled',
        },
        schedule_date: {
          type: DataTypes.TIME,
          allowNull: false,
          defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        sequelize,
        modelName: 'Appointments',
        tableName: 'appointments',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Patients, { foreignKey: 'patient_id', as: 'patient' });
    this.belongsTo(models.Professionals, { foreignKey: 'professional_id', as: 'professional' });
    this.belongsTo(models.HealthUnits, { foreignKey: 'health_unit_id', as: 'health_unit' });
  }
}

export default Appointments;
