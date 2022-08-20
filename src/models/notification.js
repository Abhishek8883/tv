'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Notification.hasMany(models.notification_tag,{
        foreignKey: "notificationId",
        sourcekey: "id"
      })
    }
  }
  Notification.init({
    title: DataTypes.STRING,
    content: DataTypes.STRING,
    read_status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Notification',
  });
  return Notification;
};