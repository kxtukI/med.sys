import { Model, DataTypes } from 'sequelize';

class Medications extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        active_ingredient: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        dosage: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        contraindications: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        manufacturer: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        photo_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Medications',
        tableName: 'medications',
      }
    );
  }

  static associate(models) {
    this.hasMany(models.MedicationReservations, { foreignKey: 'medication_id', as: 'medication_reservations' });
  }
}

export default Medications;
