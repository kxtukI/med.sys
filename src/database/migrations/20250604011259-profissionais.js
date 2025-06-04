'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('profissionais', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      registro_profissional: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      tipo_profissional: {
        type: Sequelize.ENUM('medico', 'administrativo'),
        allowNull: false,
      },
      especialidade: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      url_foto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo'),
        allowNull: false,
        defaultValue: 'ativo',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('profissionais');
  },
};
