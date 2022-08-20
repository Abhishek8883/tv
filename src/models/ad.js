'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ad extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Ad.init({
    title: DataTypes.STRING,
    adType:{
      type:DataTypes.INTEGER
    },
    content:{
      type:DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Ad',
  });
  return Ad;
};