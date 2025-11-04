import { Model, DataTypes } from 'sequelize';

class HealthUnits extends Model {
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
        address: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        state: {
          type: DataTypes.STRING(2),
          allowNull: false,
        },
        zip_code: {
          type: DataTypes.STRING(8),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        working_hours: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        photo_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true,
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'HealthUnits',
        tableName: 'health_units',
      }
    );
  }

  static associate(models) {
    this.belongsToMany(models.Professionals, {
      through: models.ProfessionalHealthUnits,
      foreignKey: 'health_unit_id',
      otherKey: 'professional_id',
      as: 'professionals',
    });

    this.hasMany(models.ProfessionalHealthUnits, {
      foreignKey: 'health_unit_id',
      as: 'professional_health_units',
    });

    this.hasMany(models.MedicationReservations, { foreignKey: 'health_unit_id', as: 'medication_reservations' });
  }
}

export default HealthUnits;
