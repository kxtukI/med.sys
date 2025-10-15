'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('referrals', 'appointment_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'appointments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('medical_records', 'referral_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'referrals', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medical_records', 'referral_id');
    await queryInterface.removeColumn('referrals', 'appointment_id');
  },
};


