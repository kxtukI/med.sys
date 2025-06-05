'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('professionals', 'health_unit_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'health_units', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('professionals', 'health_unit_id');
  }
};
