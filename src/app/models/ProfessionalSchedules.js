import { Model, DataTypes } from 'sequelize';

class ProfessionalSchedules extends Model {
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
                    references: { model: 'professionals', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                health_unit_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'health_units', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                day_of_week: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                startTime: {
                    type: DataTypes.STRING(5),
                    allowNull: false,
                    field: 'start_time',
                    validate: {
                        notNull: { msg: 'Horário inicial é obrigatório' },
                        notEmpty: { msg: 'Horário inicial não pode estar vazio' },
                    },
                },
                endTime: {
                    type: DataTypes.STRING(5),
                    allowNull: false,
                    field: 'end_time',
                    validate: {
                        notNull: { msg: 'Horário final é obrigatório' },
                        notEmpty: { msg: 'Horário final não pode estar vazio' },
                    },
                },
                durationMinutes: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 20,
                    field: 'duration_minutes',
                },
                breakStartTime: {
                    type: DataTypes.STRING(5),
                    allowNull: true,
                    field: 'break_start_time',
                },
                breakEndTime: {
                    type: DataTypes.STRING(5),
                    allowNull: true,
                    field: 'break_end_time',
                },
                bufferMinutes: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 10,
                    field: 'buffer_minutes',
                },
            },
            {
                sequelize,
                modelName: 'ProfessionalSchedules',
                tableName: 'professional_schedules',
                underscored: true,
                timestamps: true,
            }
        );
    }

    static associate(models) {
        this.belongsTo(models.Professionals, {
            foreignKey: 'professional_id',
            as: 'professional',
        });
        this.belongsTo(models.HealthUnits, {
            foreignKey: 'health_unit_id',
            as: 'health_unit',
        });
    }
}

export default ProfessionalSchedules;

