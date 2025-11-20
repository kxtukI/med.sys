export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('professional_schedules', 'duration_minutes', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 20,
    comment: 'Duração padrão de cada atendimento em minutos',
  });

  await queryInterface.addColumn('professional_schedules', 'break_start_time', {
    type: Sequelize.STRING(5),
    allowNull: true,
    comment: 'Horário de início da pausa (HH:MM)',
  });

  await queryInterface.addColumn('professional_schedules', 'break_end_time', {
    type: Sequelize.STRING(5),
    allowNull: true,
    comment: 'Horário de fim da pausa (HH:MM)',
  });

  await queryInterface.addColumn('professional_schedules', 'buffer_minutes', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 10,
    comment: 'Intervalo entre consultas em minutos',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('professional_schedules', 'duration_minutes');
  await queryInterface.removeColumn('professional_schedules', 'break_start_time');
  await queryInterface.removeColumn('professional_schedules', 'break_end_time');
  await queryInterface.removeColumn('professional_schedules', 'buffer_minutes');
}

