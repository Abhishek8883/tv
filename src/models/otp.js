'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Otp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
     Otp.belongsTo(models.User)
    }
  }
  Otp.init({
    userId:DataTypes.INTEGER,
    otp:DataTypes.INTEGER,
    otp_type:DataTypes.INTEGER,
    email:DataTypes.STRING,
    mobile:DataTypes.BIGINT,
    verified:DataTypes.BOOLEAN,
    expiry:{
      type:DataTypes.BIGINT,
    }

  },{
    sequelize,
    modelName: 'Otp',
  });
  return Otp;
};