import { Model, DataTypes } from 'sequelize';

class Professionals extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        professional_register: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        professional_type: {
          type: DataTypes.ENUM('doctor', 'administrative'),
          allowNull: false,
        },
        specialty: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        photo_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          allowNull: false,
          defaultValue: 'active',
        },
      },
      {
        sequelize,
        modelName: 'Professionals',
        tableName: 'professionals',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Users, { foreignKey: 'user_id', as: 'user' });
    
    this.belongsToMany(models.HealthUnits, {
      through: models.ProfessionalHealthUnits,
      foreignKey: 'professional_id',
      otherKey: 'health_unit_id',
      as: 'health_units',
    });

    this.hasMany(models.ProfessionalHealthUnits, {
      foreignKey: 'professional_id',
      as: 'professional_health_units',
    });

    this.hasMany(models.MedicalRecords, {
      foreignKey: 'professional_id',
      as: 'medical_records',
    });
    this.hasMany(models.Appointments, {
      foreignKey: 'professional_id',
      as: 'appointments',
    });
  }
}

export default Professionals;
