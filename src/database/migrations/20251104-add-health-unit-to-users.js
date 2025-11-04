export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'health_unit_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'health_units',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('users', ['health_unit_id']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('users', 'health_unit_id');
}
