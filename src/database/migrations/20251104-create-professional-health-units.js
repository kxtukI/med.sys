export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('professional_health_units', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    professional_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'professionals',
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
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    start_date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    end_date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addConstraint('professional_health_units', {
    fields: ['professional_id', 'health_unit_id'],
    type: 'unique',
    name: 'unique_professional_health_unit',
  });

  const professionals = await queryInterface.sequelize.query(
    `SELECT id, health_unit_id FROM professionals WHERE health_unit_id IS NOT NULL`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  if (professionals.length > 0) {
    const insertValues = professionals.map(prof => `(${prof.id}, ${prof.health_unit_id}, 'active', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).join(',');
    await queryInterface.sequelize.query(
      `INSERT INTO professional_health_units (professional_id, health_unit_id, status, start_date, end_date, created_at, updated_at) VALUES ${insertValues}`
    );
  }

  await queryInterface.removeColumn('professionals', 'health_unit_id');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addColumn('professionals', 'health_unit_id', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'health_units',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  const relationships = await queryInterface.sequelize.query(
    `SELECT DISTINCT professional_id, health_unit_id FROM professional_health_units WHERE status = 'active' ORDER BY start_date DESC LIMIT 1 GROUP BY professional_id`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  if (relationships.length > 0) {
    for (const rel of relationships) {
      await queryInterface.sequelize.query(
        `UPDATE professionals SET health_unit_id = ${rel.health_unit_id} WHERE id = ${rel.professional_id}`
      );
    }
  }

  await queryInterface.dropTable('professional_health_units');
}
