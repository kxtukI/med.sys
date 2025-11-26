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
                hooks: {
                    afterFind: (data) => {
                        if (Array.isArray(data)) {
                            data.forEach(instance => {
                                // Ensure camelCase properties are available
                                if (instance && instance.dataValues) {
                                    instance.dataValues.startTime = instance.dataValues.start_time;
                                    instance.dataValues.endTime = instance.dataValues.end_time;
                                    instance.dataValues.durationMinutes = instance.dataValues.duration_minutes;
                                    instance.dataValues.breakStartTime = instance.dataValues.break_start_time;
                                    instance.dataValues.breakEndTime = instance.dataValues.break_end_time;
                                    instance.dataValues.bufferMinutes = instance.dataValues.buffer_minutes;
                                }
                            });
                        } else if (data && data.dataValues) {
                            // Ensure camelCase properties are available
                            data.dataValues.startTime = data.dataValues.start_time;
                            data.dataValues.endTime = data.dataValues.end_time;
                            data.dataValues.durationMinutes = data.dataValues.duration_minutes;
                            data.dataValues.breakStartTime = data.dataValues.break_start_time;
                            data.dataValues.breakEndTime = data.dataValues.break_end_time;
                            data.dataValues.bufferMinutes = data.dataValues.buffer_minutes;
                        }
                        return data;
                    }
                }
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

