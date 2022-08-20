'use strict';

const sequelize = require("sequelize");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull:false
      },
      email:  {
        type: Sequelize.STRING,
        unique:true
      },
      mobile:{
        type:Sequelize.BIGINT,
        unique:true
      },
      password: {
        type: Sequelize.STRING,
      },
      confirm_password:{
        type:Sequelize.STRING
      },
      dob:{
        type:Sequelize.DATE
      },
      gender:{
        type:Sequelize.INTEGER,
        comment:'0:Male, 1:Female'
      },
      status:{
        type:Sequelize.INTEGER,
        allowNull:false,
        defaultValue:0,
      comment:"0:Deleted,1:Active,2:Inactive,3:Unverified,"
      },
      reset_token:{
        type:Sequelize.STRING
      },
      fcm_token:{
        type:Sequelize.STRING
      },
      social_login_id:{
        type:Sequelize.STRING,
      },
      social_login_type:{
        type:Sequelize.INTEGER,
        comment:"1:google,2:facebook"
      },
      image:{
        type:Sequelize.STRING
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
    await queryInterface.dropTable('Users');
  }
};