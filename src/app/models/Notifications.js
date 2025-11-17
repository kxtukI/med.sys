import { Model, DataTypes, Sequelize } from 'sequelize';

class Notifications extends Model {
    static init(sequelize) {
        super.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true
                },
                target_type: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                target_id: {
                    type: DataTypes.INTEGER, allowNull: false,
                    references: { model: 'patients', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                appointment_id: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: { model: 'appointments', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
                },
                type: {
                    type: DataTypes.STRING,
                    allowNull: false
                },
                message: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: 'Sua consulta está agendada para {date} às {time}. Por favor, chegue 15 minutos antes da consulta.'
                },
                channel: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: 'sms',
                },
                status: {
                    type: DataTypes.ENUM('pending', 'sent', 'failed'),
                    allowNull: false,
                    defaultValue: 'pending',
                },
                scheduled_for: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                sent_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                token: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            },
            {
                sequelize,
                modelName: 'Notifications',
                tableName: 'notifications',
                timestamps: false,
            }
        );
    }

    static associate(models) {
        this.belongsTo(models.Appointments, { foreignKey: 'appointment_id', as: 'appointment' });
    }
}

export default Notifications;