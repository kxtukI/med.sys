import { Model, DataTypes } from 'sequelize';

class MedicationReservations extends Model {
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
        },
        medication_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        health_unit_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('reserved', 'ready', 'picked_up', 'canceled', 'expired'),
          allowNull: false,
          defaultValue: 'reserved',
        },
        scheduled_pickup_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reserved_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        picked_up_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'MedicationReservations',
        tableName: 'medication_reservations',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Patients, { foreignKey: 'patient_id', as: 'patient' });
    this.belongsTo(models.Medications, { foreignKey: 'medication_id', as: 'medication' });
    this.belongsTo(models.HealthUnits, { foreignKey: 'health_unit_id', as: 'healthUnit' });
  }
}

export default MedicationReservations;

