'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('estoque_medicamentos', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      medicamento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'medicamentos',
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
      quantidade_disponivel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      data_atualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('estoque_medicamentos');
  },
};
