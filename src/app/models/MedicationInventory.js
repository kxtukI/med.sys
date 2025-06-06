import { Model, DataTypes } from 'sequelize';

class MedicationInventory extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      medication_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'medications',
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
      available_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      update_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      },
      {
        sequelize,
        modelName: 'MedicationInventory',
        tableName: 'medication_inventory',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Medications, { foreignKey: 'medication_id', as: 'medication' });
    this.belongsTo(models.HealthUnits, { foreignKey: 'health_unit_id', as: 'healthUnit' });
  }
}

export default MedicationInventory;
