let Response = require("../../services/response");
const {
  User,
  Comment,
  Reply,
  post_like,
  comment_like,
  read_article
} = require("../../models");
const { Op, Sequelize } = require("sequelize");
let Helper = require("../../services/helper");
const Joi = require("joi");
const {
  INTERNAL_SERVER,
  SUCCESS,
  UPDATE,
  INACTIVE,
  BAD_REQUEST,
} = require("../../services/constant");

module.exports = {
    

  // api to create comment
  createComment: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      postId: Joi.number().integer().required(),
      content: Joi.string().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }
    await Comment.create({
      userId: req.authUserId,
      postId: reqParam.postId,
      content: reqParam.content,
    })
      .then(async (createdComment) => {
        return Response.successResponseData(
          res,
          createdComment,
          res.locals.__("Comment created successfully."),
          SUCCESS
        );
      })
      .catch((err) => {
        return Response.errorResponseData(
          res,
          err,
          res.locals.__("Something went wrong."),
          INTERNAL_SERVER
        );
      });
  },

  // api to create reply of comment
  createReply: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      commentId: Joi.number().integer().required(),
      content: Joi.string().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }
    const replyExist = await Reply.findAll({
      where: {
        [Op.and]: {
          commentId: reqParam.commentId,
          userId: req.authUserId,
        },
      },
    });
    if (replyExist.length > 0) {
      return Response.successResponseWithoutData(
        res,
        res.locals.__("Already replied."),
        SUCCESS
      );
    } else {
      await Reply.create({
        userId: req.authUserId,
        commentId: reqParam.commentId,
        content: reqParam.content,
      })
        .then(async (createdReply) => {
          return Response.successResponseData(
            res,
            createdReply,
            res.locals.__("Reply created successfully."),
            SUCCESS
          );
        })
        .catch((err) => {
          return Response.errorResponseData(
            res,
            err,
            res.locals.__("Something went wrong."),
            INTERNAL_SERVER
          );
        });
    }
  },

  // api to get comment and its replies
  getPostData: async (req, res, next) => {
    const postid = req.query.postId;

    const postLikes = await post_like.count({
      where: {
        postId: postid,
      },
    });

    await Comment.findAndCountAll({
      attributes: {
        include: [
          [
            Sequelize.literal(`(
                                SELECT COUNT(commentId) FROM comment_likes
                                WHERE comment_likes.commentId = Comment.id 
                            )`),
            "comment_likes",
          ],
        ],
      },
      where: {
        postId: postid,
      },
      include: [
        {
          model: User,
          attributes: {
            exclude: [
              "password",
              "confirm_password",
              "reset_token",
              "fcm_token",
              "dob",
              "gender",
              "social_login_type",
              "social_login_id",
              "mobile",
              "status",
            ],
          },
        },
        {
          model: Reply,
          include: [
            {
              model: User,
              attributes: {
                exclude: [
                  "password",
                  "confirm_password",
                  "reset_token",
                  "fcm_token",
                  "dob",
                  "gender",
                  "social_login_type",
                  "social_login_id",
                  "mobile",
                  "status",
                ],
              },
            },
          ],
        },
      ],
    })
      .then(async (foundComment) => {
        return Response.successResponseData(
          res,
          { post_likes: postLikes, comments: foundComment },
          res.locals.__("Comment fetched successfully")
        );
      })
      .catch((err) => {
        return Response.errorResponseData(
          res,
          err,
          res.locals.__("Something went wrong."),
          INTERNAL_SERVER
        );
      });
  },

  // api for post likes
  postLike: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      postId: Joi.number().integer().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }
    const likeExists = await post_like.findAll({
      where: {
        [Op.and]: {
          userId: req.authUserId,
          postId: reqParam.postId,
        },
      },
    });
    if (likeExists.length > 0) {
      await post_like
        .destroy({
          where: {
            [Op.and]: {
              userId: req.authUserId,
              postId: reqParam.postId,
            },
          },
        })
        .then(() => {
          return Response.successResponseWithoutData(
            res,
            res.locals.__("Unliked"),
            SUCCESS
          );
        })
        .catch((err) => {
          return Response.errorResponseData(
            res,
            err,
            res.locals.__("Something went wrong."),
            INTERNAL_SERVER
          );
        });
    } else {
      await post_like
        .create({
          postId: reqParam.postId,
          userId: req.authUserId,
        })
        .then(() => {
          return Response.successResponseWithoutData(
            res,
            res.locals.__("Liked."),
            SUCCESS
          );
        })
        .catch((err) => {
          return Response.errorResponseData(
            res,
            err,
            res.locals.__("Something went wrong."),
            INTERNAL_SERVER
          );
        });
    }
  },

  //api for comment likes
  commentLike: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      commentId: Joi.number().integer().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }
    const likeExists = await comment_like.findAll({
      where: {
        [Op.and]: {
          userId: req.authUserId,
          commentId: reqParam.commentId,
        },
      },
    });
    if (likeExists.length > 0) {
      await comment_like
        .destroy({
          where: {
            [Op.and]: {
              userId: req.authUserId,
              commentId: reqParam.commentId,
            },
          },
        })
        .then(() => {
          return Response.successResponseWithoutData(
            res,
            res.locals.__("Unliked"),
            SUCCESS
          );
        })
        .catch((err) => {
          return Response.errorResponseData(
            res,
            err,
            res.locals.__("Something went wrong."),
            INTERNAL_SERVER
          );
        });
    } else {
      await comment_like
        .create({
          commentId: reqParam.commentId,
          userId: req.authUserId,
        })
        .then(() => {
          return Response.successResponseWithoutData(
            res,
            res.locals.__("Liked."),
            SUCCESS
          );
        })
        .catch((err) => {
          return Response.errorResponseData(
            res,
            err,
            res.locals.__("Something went wrong."),
            INTERNAL_SERVER
          );
        });
    }
  },


  // api to marked article as read 
  markRead : async (req,res,next) => {
    const reqParam = req.body
    const reqObj = {
      postId: Joi.number().integer().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }
    const readStatus = await read_article.findOne({
      where:{
        articleId:reqParam.postId
      }
    })
    if(!readStatus){
      await read_article.create({
        articleId:reqParam.postId
      })
      .then( () => {
        return Response.successResponseWithoutData(res,res.locals.__("Article marked as read."),SUCCESS)
      })
      .catch( err => {
        return Response.successResponseData(res,err,res.locals.__("Something went wrong."),INTERNAL_SERVER)
      })
    }
    else{
      return Response.successResponseWithoutData(res,res.locals.__("Already marked as read."))
    }
    
  },

  getReadStatus:async (req,res,next) => {
    const postId = req.query.postId
    const readStatus = await read_article.findOne({
      where:{
        articleId:postId
      }
    })

    if(readStatus){
      return Response.successResponseWithoutData(res,res.locals.__("true"),SUCCESS)
    }
    else{
      return Response.successResponseWithoutData(res,res.locals.__("false"),SUCCESS)
    }
  },

  shareArticle: async (req,res,next) => {
    const reqParam = req.body;
    const reqObj = {
      link: Joi.string().required(),
      name: Joi.string().required(),
      id: Joi.string().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }
    const infoObj = {
      link:reqParam.link,
      name:reqParam.name,
      id:String(reqParam.id)
    }

    await Helper.createDynamicLink(infoObj)
    .then( shortLink => {
      return Response.successResponseData(res,shortLink,res.locals.__("Success."),SUCCESS)
    })
    .catch(err => {
      return Response.errorResponseData(res,err,res.locals.__("Something went wrong."),INTERNAL_SERVER)
    })
  }
}