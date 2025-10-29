'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medication_reservations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      medication_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'medications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      health_unit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'health_units',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('reserved', 'ready', 'picked_up', 'canceled', 'expired'),
        allowNull: false,
        defaultValue: 'reserved',
      },
      scheduled_pickup_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reserved_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      picked_up_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('medication_reservations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_medication_reservations_status";');
  },
};

