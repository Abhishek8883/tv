let Response = require("../../services/response");
const { hashPassword, comparepassword } = require("../../utils/bcrypt");
const { Admin, User, Feedback, Quiz, Option } = require("../../models");
const { Op } = require("sequelize");
let Helper = require("../../services/helper");
const Joi = require("joi");
const jwtToken = require("../../services/jwtToken");
const {
  ACTIVE,
  DELETE,
  UNVERIFIED,
  UNAUTHORIZED,
  INTERNAL_SERVER,
  SUCCESS,
  UPDATE,
} = require("../../services/constant");
const { object } = require("joi");
const { successResponseWithoutData } = require("../../services/response");
const base_url = process.env.base_url;

module.exports = {
  showAll: async (req, res, next) => {
    try {
      let p = req.params.page <= 0 || !req.params.page ? 1 : req.params.page;
      const page = Number(p);
      const count = await Quiz.count();
      const quiz = await Quiz.findAndCountAll({
        include: [{ model: Option }],
        limit: 10,
        offset: (page - 1) * 10,
      });

      const isData = (() => {
        if (quiz.rows.length > 0) {
          return true;
        } else {
          return false;
        }
      })();
      const totalPages = Math.floor(count / 10.0000001) + 1;
      const nextPage = totalPages > page ? page + 1 : 0;
      const previousPage = page <= 1 ? 0 : page - 1;

      return res.render("quiz/index", {
        quiz: quiz.rows,
        count,
        page,
        previousPage,
        nextPage,
        isData,
        active: "quiz",
      });
    } catch (err) {
      return Response.errorResponseData(
        res,
        err,
        res.locals.__("Something went wrong")
      );
    }
  },

  createQuizPage: async (req, res, next) => {
    try {
      let success = await req.flash("success");
      console.log(":  success   : ", success);
      return res.render("quiz/create", { success, active: "quiz" });
    } catch (err) {
      return Response.errorResponseData(
        res,
        err,
        res.locals.__("Something went wrong ")
      );
    }
  },

  createQuiz: async (req, res, next) => {
    try {
      let arr = [];
      const reqParam = req.body;
      const reqObj = {
        question: Joi.string().trim().max(50).required(),
        totalQuestion: Joi.number().integer().max(6).required(),
        radio: Joi.string().required(),
      };
      const schema = Joi.object(reqObj);
      const { error } = schema.validate({
        question: reqParam.question,
        totalQuestion: Number(reqParam.total_options),
        radio: reqParam.radio,
      });
      if (error) {
        return Response.validationErrorResponseData(
          res,
          res.__(Helper.validationMessageKey("Input validation", error))
        );
      } else {
        for (const key in reqParam) {
          if (reqParam.hasOwnProperty.call(reqParam, key)) {
            const element = reqParam[key];
            if (reqParam[key] === "") {
              return Response.errorResponseData(
                res,
                key,
                res.locals.__("Fields should not be empty.")
              );
            }
          }
        }

        const quiz = await Quiz.create({
          question: reqParam.question,
          totalQuestion: Number(reqParam.total_options),
        });
        if (quiz) {
          for (const key in reqParam) {
            if (reqParam.hasOwnProperty.call(reqParam, key)) {
              if (reqParam[key] !== "") {
                if (
                  key === "question" ||
                  key === "total_options" ||
                  key === "radio"
                ) {
                  continue;
                } else {
                  if (key === reqParam.radio) {
                    arr.push({
                      option: reqParam[key],
                      quizId: quiz.id,
                      isCorrect: true,
                    });
                  } else {
                    arr.push({
                      option: reqParam[key],
                      quizId: quiz.id,
                      isCorrect: false,
                    });
                  }
                }
              } else {
                await Quiz.destroy({
                  where: {
                    id: quiz.id,
                  },
                });
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("All fields are required")
                );
              }
            }
          }

          const options = await Option.bulkCreate(arr);
          if (options) {
            req.flash("success", "Quiz added successfully");
            return res.redirect(base_url + "/admin/quiz/createQuiz");
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("Internal server error")
            );
          }
        }
      }
    } catch (err) {
      return Response.errorResponseData(
        res,
        err,
        res.locals.__("Something went wrong ")
      );
    }
  },

  Delete: async (req, res, next) => {
    const quizid = Number(req.params.quizid);
    await Quiz.destroy({
      where: {
        id: quizid,
      },
    })
      .then(async () => {
        await Option.destroy({
          where: {
            quizId: quizid,
          },
        }).then(async () => {
          return res.redirect(req.header("Referer"));
        });
      })
      .catch((err) => {
        return Response.errorResponseData(
          res,
          err,
          res.locals.__("Something went wrong")
        );
      });
  },

  getEditQuizPage: async (req, res, next) => {
    console.log("getEditQuizPage");
    try {
      const quizid = Number(req.params.quizid);
      const quiz = await Quiz.findOne({
        where: {
          id: quizid,
        },
        include: [{ model: Option }],
      });
      // res.send(quiz)
      if (quiz) {
        return res.render("quiz/edit", { quiz, active: "quiz" });
      }
    } catch (error) {
      return Response.errorResponseData(
        res,
        error,
        res.locals.__("Something went wrong")
      );
    }
  },

  editQuiz: async (req, res, next) => {
    try {
      let arr = [];
      const reqParam = req.body;
      const quizid = Number(req.params.quizid);
      const reqObj = {
        question: Joi.string().trim().required(),
        radio: Joi.string().required(),
      };
      const schema = Joi.object(reqObj);
      const { error } = schema.validate({
        question: reqParam.question,
        radio: reqParam.radio,
      });
      if (error) {
        return Response.validationErrorResponseData(
          res,
          res.__(Helper.validationMessageKey("Sign up validation", error))
        );
      } else {
        for (const key in reqParam) {
          if (reqParam.hasOwnProperty.call(reqParam, key)) {
            const element = reqParam[key];
            if (reqParam[key] === "") {
              return Response.errorResponseData(
                res,
                key,
                res.locals.__("Fields should not be empty.")
              );
            }
          }
        }

        const updated = await Quiz.update(
          { question: reqParam.question },
          {
            where: {
              id: quizid,
            },
          }
        );

        for (const key in reqParam) {
          if (reqParam.hasOwnProperty.call(reqParam, key)) {
            if (
              key === "question" ||
              key === "total_options" ||
              key === "radio"
            ) {
              continue;
            } else {
              if (key === reqParam.radio) {
                arr.push({
                  option: reqParam[key],
                  quizId: quizid,
                  isCorrect: true,
                });
              } else {
                arr.push({
                  option: reqParam[key],
                  quizId: quizid,
                  isCorrect: false,
                });
              }
            }
          }
        }

        const foundQuiz = await Quiz.findOne({
          where: {
            id: quizid,
          },
          include: [{ model: Option }],
        });

        const fillData = foundQuiz.Options.forEach(async (elem, i) => {
          await Option.update(arr[i], {
            where: {
              id: elem.id,
            },
          });
        });
        return Response.successResponseWithoutData(
          res,
          res.locals.__("Quiz updated successfully")
        );
      }
    } catch (error) {
      return Response.errorResponseData(
        res,
        error,
        res.locals.__("Something went wrong")
      );
    }
  },
};