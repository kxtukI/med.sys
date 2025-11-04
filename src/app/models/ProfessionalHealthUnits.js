import { Model, DataTypes } from 'sequelize';

class ProfessionalHealthUnits extends Model {
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
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          allowNull: false,
          defaultValue: 'active',
        },
        start_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        end_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'ProfessionalHealthUnits',
        tableName: 'professional_health_units',
        indexes: [
          {
            unique: true,
            fields: ['professional_id', 'health_unit_id'],
          },
        ],
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Professionals, { foreignKey: 'professional_id', as: 'professional' });
    this.belongsTo(models.HealthUnits, { foreignKey: 'health_unit_id', as: 'health_unit' });
  }
}

export default ProfessionalHealthUnits;
