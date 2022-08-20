'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class notification_tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  notification_tag.init({
    notificationId: DataTypes.INTEGER,
    tagId: DataTypes.INTEGER,
    tagname: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'notification_tag',
  });
  return notification_tag;
};