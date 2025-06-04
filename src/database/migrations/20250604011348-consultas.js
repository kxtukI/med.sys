'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consultas', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      paciente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pacientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      profissional_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'profissionais',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      unidade_saude_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'unidades_saude',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      data_hora: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      especialidade: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('agendada', 'cancelada', 'realizada'),
        allowNull: false,
        defaultValue: 'agendada',
      },
      data_agendamento: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('consultas');
  },
};
