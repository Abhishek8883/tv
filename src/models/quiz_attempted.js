'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class quiz_attempt extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  quiz_attempt.init({
    userId: DataTypes.INTEGER,
    quizId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'quiz_attempt',
  });
  return quiz_attempt;
};