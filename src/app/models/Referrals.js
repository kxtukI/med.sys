import { Model, DataTypes } from 'sequelize';

class Referrals extends Model {
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
          references: { model: 'patients', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        from_professional_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'professionals', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        to_specialty: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'used', 'canceled'),
          allowNull: false,
          defaultValue: 'approved',
        },
        valid_until: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'appointments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      },
      {
        sequelize,
        modelName: 'Referrals',
        tableName: 'referrals',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Patients, { foreignKey: 'patient_id', as: 'patient' });
    this.belongsTo(models.Professionals, { foreignKey: 'from_professional_id', as: 'from_professional' });
    this.belongsTo(models.Appointments, { foreignKey: 'appointment_id', as: 'appointment' });
  }
}

export default Referrals;


