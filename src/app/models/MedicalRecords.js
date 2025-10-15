import { Model, DataTypes } from 'sequelize';

class MedicalRecords extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      record_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      observations: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      prescribed_medications: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requested_exams: {
        type: DataTypes.TEXT,
        allowNull: true,
      }, 
      disease_history: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      allergies: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      treatment_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      referral_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'referrals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      },
      {
        sequelize,
        modelName: 'MedicalRecords',
        tableName: 'medical_records',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Professionals, {
      foreignKey: 'professional_id',
      as: 'professional',
    });
    this.belongsTo(models.Appointments, {
      foreignKey: 'appointment_id',
      as: 'appointment',
    });
    this.belongsTo(models.Referrals, {
      foreignKey: 'referral_id',
      as: 'referral',
    });
  }
}

export default MedicalRecords;
