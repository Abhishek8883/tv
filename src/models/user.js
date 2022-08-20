'use strict';
const {
  Model
} = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Feedback, {
        foreignKey: "userId",
        sourcekey: "id"
      }),
      User.hasOne(models.Otp,{
        foreignKey: "userId",
        sourcekey: "id"
      }),
      User.belongsToMany(models.Quiz,{
       through:'quiz_attempted',
       foreignKey:'userId'
      })
      User.hasMany(models.user_tag,{
        foreignKey: "userId",
        sourcekey: "id"
      })
      
    }
  }
  User.init({
    name:{
      type: DataTypes.STRING,
      allowNull: false
    },
    email:{
      type: DataTypes.STRING,
      unique:true
    },
    mobile:{
      type:DataTypes.BIGINT,
      unique:true
    },
    password:{
      type: DataTypes.STRING,
    },
    confirm_password:{
      type:DataTypes.STRING
    },
    dob:{
      type:DataTypes.DATE
    },
    gender:{
      type:DataTypes.INTEGER
    },
    status:{
      type:DataTypes.INTEGER,
      allowNull:false,
      defaultValue:0,
    },
    reset_token:{
      type:DataTypes.STRING
    },
    fcm_token:{
      type:DataTypes.STRING
    },
    social_login_type:{
      type:DataTypes.INTEGER
    },
    social_login_id:{
      type:DataTypes.STRING
    },
    image:{
      type:DataTypes.STRING
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};