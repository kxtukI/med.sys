'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { 
        type: Sequelize.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
      target_type: { 
        type: Sequelize.STRING, 
        allowNull: false,
        enum: ['patient', 'professional']
    },
      target_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      appointment_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true, 
        references: { model: 'appointments', key: 'id' }, 
        onUpdate: 'CASCADE', 
        onDelete: 'SET NULL' 
    },
      type: { 
        type: Sequelize.STRING, 
        allowNull: false, 
        enum: ['appointment_reminder', 'medication_reservation', 'appointment_late', 'medication_pickup'] 
    },
      message: { 
        type: Sequelize.STRING, 
        allowNull: false,
        defaultValue: 'Sua consulta está agendada para {date} às {time}. Por favor, chegue 15 minutos antes da consulta.' 
    },
      channel: { 
        type: Sequelize.STRING, 
        allowNull: false, 
        defaultValue: 'sms', 
        enum: ['sms', 'email'] 
    },
      status: { 
        type: Sequelize.ENUM('pending', 'sent', 'failed'), 
        allowNull: false, 
        defaultValue: 'pending', 
        enum: ['pending', 'sent', 'failed'] 
    },
      scheduled_for: { 
        type: Sequelize.DATE, 
        allowNull: true, 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
    },
      sent_at: { 
        type: Sequelize.DATE, 
        allowNull: true, 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP') 
    },
      token: { 
        type: Sequelize.STRING, 
        allowNull: true, 
        defaultValue: null 
    },
      created_at: { 
        allowNull: false, 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP') 
    },
      updated_at: { 
        allowNull: false, 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), 
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
