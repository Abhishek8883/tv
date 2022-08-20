'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class read_article extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  read_article.init({
    articleId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'read_article',
  });
  return read_article;
};