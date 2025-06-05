'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('professionals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      professional_register: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      professional_type: {
        type: Sequelize.ENUM('doctor', 'administrative'),
        allowNull: false,
      },
      specialty: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      photo_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('professionals');
  },
};
