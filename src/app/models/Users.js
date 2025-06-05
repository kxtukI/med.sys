import { Model, DataTypes } from 'sequelize';

class Users extends Model {
    static init(sequelize) {
        super.init({
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true,
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            user_type: {
                type: DataTypes.ENUM('patient', 'professional'),
                allowNull: false,
                defaultValue: 'patient',
            },
            registration_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'),
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        }, {
            sequelize,
            modelName: 'Users',
            tableName: 'users',
        });
    }

    static associate(models) {
        this.hasMany(models.Professionals, {
            foreignKey: 'user_id',
            as: 'professionals',
        });
        this.hasMany(models.Patients, {
            foreignKey: 'user_id',
            as: 'patients',
        });
    }
}

export default Users;