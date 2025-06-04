'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prontuarios', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      consulta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'consultas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      data_hora_registro: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      observacoes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      medicamentos_prescritos: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      exames_solicitados: {
        type: Sequelize.TEXT,
        allowNull: true,
      }, 
      historico_doencas: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      alergias: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      plano_tratamento: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('prontuarios');
  },
};
