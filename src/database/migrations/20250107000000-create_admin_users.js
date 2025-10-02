'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin Sistema',
        email: 'admin@sistema.com',
        password_hash: '$2b$08$CHuZYt1TivggJ4uCLs..les6yLB2.1Fwr5Snoqv6LN3wYPdlOq9sO',
        phone: '11999999999',
        user_type: 'admin',
        registration_date: new Date(),
        active: true,
      },
      {
        name: 'Super Admin',
        email: 'super.admin@sistema.com',
        password_hash: '$2b$08$goH7TJsu.Y6T1xbf8Mcx0uVhL/83KHWKds7GJJU3QWNdC/RnsE.7y',
        phone: '11888888888',
        user_type: 'admin',
        registration_date: new Date(),
        active: true,
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@sistema.com', 'super.admin@sistema.com']
    }, {});
  }
};
