'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Quiz extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Quiz.belongsToMany(models.User,{
        through:'quiz_attempts',
        foreignKey:'quizId'
       })
       
       Quiz.hasMany(models.Option,{
        foreignKey:'quizId',
        sourceKey:"id"
      })
    }
  }
  Quiz.init({
    question: DataTypes.STRING,
    totalQuestion: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Quiz',
  });
  return Quiz;
};