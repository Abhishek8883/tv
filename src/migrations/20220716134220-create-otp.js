'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Otps', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      otp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      otp_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "1:Email, 2:Mobile"
      },
      email: {
        type: Sequelize.STRING,
      },
      mobile: {
        type: Sequelize.BIGINT,
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull:false
      },
      expiry: {
        type: Sequelize.BIGINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Otps');
  }
};