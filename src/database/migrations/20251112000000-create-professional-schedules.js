export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('professional_schedules', {
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
        day_of_week: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 6,
            },
            comment: '0 = Domingo, 1 = Segunda, ..., 6 = Sábado',
        },
        start_time: {
            type: Sequelize.STRING(5),
            allowNull: false,
        },
        end_time: {
            type: Sequelize.STRING(5),
            allowNull: false,
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

    await queryInterface.addConstraint('professional_schedules', {
        fields: ['professional_id', 'health_unit_id', 'day_of_week'],
        type: 'unique',
        name: 'unique_professional_schedule',
    });

    await queryInterface.addIndex('professional_schedules', ['professional_id']);
    await queryInterface.addIndex('professional_schedules', ['health_unit_id']);
    await queryInterface.addIndex('professional_schedules', ['day_of_week']);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('professional_schedules');
}

