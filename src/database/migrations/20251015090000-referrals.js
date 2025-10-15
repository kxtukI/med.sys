'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('referrals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      from_professional_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'professionals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      to_specialty: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'used', 'canceled'),
        allowNull: false,
        defaultValue: 'approved',
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('referrals');
  },
};


