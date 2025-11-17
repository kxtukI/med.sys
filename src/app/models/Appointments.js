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
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        sequelize,
        modelName: 'Appointments',
        tableName: 'appointments',
        hooks: {
          afterCreate: async (appointment, options) => {
            const { default: MedicalRecords } = await import('./MedicalRecords.js');
            await MedicalRecords.create({
              professional_id: appointment.professional_id,
              appointment_id: appointment.id,
              record_date: new Date(),
            }, { transaction: options.transaction });
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Patients, { foreignKey: 'patient_id', as: 'patient' });
    this.belongsTo(models.Professionals, { foreignKey: 'professional_id', as: 'professional' });
    this.belongsTo(models.HealthUnits, { foreignKey: 'health_unit_id', as: 'health_unit' });
    this.hasMany(models.MedicalRecords, { foreignKey: 'appointment_id', as: 'medical_records' });
  }
}

export default Appointments;
