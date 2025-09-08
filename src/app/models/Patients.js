import { Model, DataTypes } from 'sequelize';

class Patients extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
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
        sus_number: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        cpf: {
          type: DataTypes.STRING(11),
          allowNull: false,
          unique: true,
        },
        birth_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING(2),
          allowNull: true,
        },
        zip_code: {
          type: DataTypes.STRING(8),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Patients',
        tableName: 'patients',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Users, { foreignKey: 'user_id', as: 'users' });
    this.hasMany(models.Appointments, { foreignKey: 'patient_id', as: 'appointments' });
  }
}

export default Patients;
