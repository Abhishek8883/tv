'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Comment.hasMany(models.Reply, {
        foreignKey: "commentId",
        sourcekey: "id"
      })
      Comment.hasMany(models.comment_like, {
        foreignKey: "commentId",
        sourcekey: "id"
      })
      Comment.belongsTo(models.User)
    }
  }
  Comment.init({
    userId: DataTypes.INTEGER,
    postId: DataTypes.INTEGER,
    content: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Comment',
  });
  return Comment;
};