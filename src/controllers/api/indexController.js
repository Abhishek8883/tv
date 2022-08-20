let Response = require("../../services/response");
const { hashPassword, comparepassword } = require("../../utils/bcrypt");
const {
  User,
  Feedback,
  Otp,
  user_tag,
} = require("../../models");

  const { Op, Sequelize } = require("sequelize");
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
  INACTIVE,
  BAD_REQUEST,
  VERIFY_EMAIL_TEMPLATE,
  RESET_PASSWORD_TEMPLATE
} = require("../../services/constant");
const { sendMail } = require("../../utils/mail");
const base_url = process.env.base_url;
const axios = require("axios");

module.exports = {
  // user signup
  signup: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      name: Joi.string().trim().max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{4,50}$/)
        .required(),
      confirm_password: Joi.any().valid(Joi.ref("password")).required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Sign up validation", error))
      );
    } else {
      if (reqParam.email && reqParam.email !== "") {
        // finding weather user is deleted.
        const DeletduserEmailExist = await User.findOne({
          where: {
            email: reqParam.email,
            status: DELETE,
          },
        }).then((userEmailData) => userEmailData);
        if (DeletduserEmailExist) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__(
              "Email address is already registered with us, with deleted status"
            )
          );
        }

        const userEmailExist = await User.findOne({
          where: {
            email: reqParam.email,
            status: {
              [Op.not]: DELETE,
            },
          },
        }).then((userEmailData) => userEmailData);

        if (userEmailExist) {
          if (Number(userEmailExist.status) === ACTIVE) {
            return Response.successResponseData(
              res,
              { email: userEmailExist.email },
              res.locals.__("User already exist please login.")
            );
          }

          if (Number(userEmailExist.status) === INACTIVE) {
            return Response.errorResponseData(
              res,
              { email: userEmailExist.email },
              res.locals.__("Account blocked")
            );
          }

          if (Number(userEmailExist.status) === UNVERIFIED) {
            // let code = Math.floor(100000 + Math.random() * 900000);
            let code = 222222;

            let otpObj = {
              userId: userEmailExist.id,
              otp: code,
              otp_type: 1,
              email: userEmailExist.email,
              expiry: Date.now() + 300000,
            };

            await Otp.create(otpObj)
              .then(async (createdOtp) => {
                sendMail(
                  userEmailExist.email,
                  "Email Verification",
                  VERIFY_EMAIL_TEMPLATE,
                  {
                    user: userEmailExist.name,
                    otp: code,
                  }
                )
                  .then(async (data) => {
                    return Response.successResponseData(
                      res,
                      { email: userEmailExist.email },
                      res.locals.__("Email already exists and otp sent again")
                    );
                  })
                  .catch((err) => {
                    return Response.errorResponseData(
                      res,
                      err,
                      res.locals.__("Something went wrong.")
                    );
                  });
              })
              .catch((e) => {
                console.log(e);
                return Response.errorResponseWithoutData(
                  res,
                  res.__("Something went wrong")
                );
              });
          }
          //   return Response.errorResponseWithoutData(
          //       res,
          //       res.locals.__(
          //           "Email already exist, can not send OTP right now."
          //       )
          //   );
        } else {
          const passwordHash = hashPassword(reqParam.password);
          let userObj = {
            name: reqParam.name,
            email: reqParam.email,
            password: passwordHash,
            status: UNVERIFIED,
          };

          await User.create(userObj)
            .then(async (result) => {
              if (!result) {
                return Response.errorResponseWithoutData(
                  res,
                  res.__("Something went wrong")
                );
              }
              const token = jwtToken.issueUser({
                id: result.id,
                email: result.email,
              });
              result.reset_token = token;
              result.save();

              // let code = Math.floor(100000 + Math.random() * 900000);
              let code = 222222;

              let otpObj = {
                userId: result.id,
                otp: code,
                otp_type: 1,
                email: reqParam.email,
                expiry: Date.now() + 300000,
              };

              // result object for sending in response
              let resultObj = {
                name: result.name,
                email: result.email,
                mobile: result.mobile,
                status: result.status,
                reset_token: result.reset_token,
                fcm_token: result.fcm_token,
                social_login_type: result.social_login_type,
                social_login_id: result.social_login_id,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
              };

              //  creating otp
              await Otp.create(otpObj)
                .then(async (createdOtp) => {
                  sendMail(
                    result.email,
                    "Email Verification",
                    VERIFY_EMAIL_TEMPLATE,
                    {
                      user: result.name,
                      otp: code,
                    }
                  );
                })
                .then((data) => {
                  return Response.successResponseData(
                    res,
                    resultObj,
                    res.locals.__(
                      "User created successfully and otp sent to mail."
                    )
                  );
                })
                .catch((err) => {
                  return Response.errorResponseWithoutData(
                    res,
                    err,
                    res.__("Something went wrong")
                  );
                });
            })
            .catch((e) => {
              console.log(e);
              return Response.errorResponseWithoutData(
                res,
                res.__("Something went wrong")
              );
            });
        }
      }
    }
  },

  // user login
  login: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      email: Joi.string().email().required(),
      password: Joi.string()
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{4,50}$/)
        .required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Login validation", error))
      );
    } else {
      let user = await User.findOne({
        where: {
          email: reqParam.email,
          status: {
            [Op.or]: [ACTIVE, UNVERIFIED],
          },
        },
      });
      if (!user) {
        return Response.errorResponseWithoutData(
          res,
          res.locals.__("Email does not exist.")
        );
      }
      if (Number(user.status) === Number(UNVERIFIED)) {
        return Response.errorResponseWithoutData(
          res,
          res.locals.__("Email not verified.")
        );
      }
      const validate = comparepassword(reqParam.password, user.password);
      if (!validate) {
        return Response.errorResponseWithoutData(
          res,
          res.locals.__("Wrong password entered.")
        );
      }

      const token = jwtToken.issueUser({
        id: user.id,
        email: user.email,
      });

      user.reset_token = token;
      user.save().then(
        async (updateData) => {
          if (updateData) {
            updateData = {
              id: updateData.id,
              name: updateData.name,
              email: updateData.email,
              status: updateData.status,
              reset_token: updateData.reset_token,
            };
            return Response.successResponseData(
              res,
              updateData,
              res.locals.__("Logged in successfully")
            );
          } else {
            return Response.errorResponseData(
              res,
              res.__("Something went wrong")
            );
          }
        },
        (e) => {
          Response.errorResponseData(res, res.__("Internal error"));
        }
      );
      return null;
    }
  },

  // verify user email
  verifyEmail: async (req, res, next) => {
    try {
      const reqParam = req.body;
      const reqObj = {
        verification_code: Joi.string().min(6).max(6).required(),
        email: Joi.string().email().required(),
      };
      const schema = Joi.object(reqObj);
      const { error } = schema.validate({
        verification_code: String(reqParam.verification_code),
        email: reqParam.email,
      });
      if (error) {
        return Response.validationErrorResponseData(
          res,
          res.__(Helper.validationMessageKey("Login validation", error))
        );
      } else {
        User.findOne({
          where: {
            email: reqParam.email,
          },
          include: [{ model: Otp }],
          order: [[Otp, "id", "DESC"]],
        }).then(async (result) => {
          if (!result) {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("Incorrect email."),
              401
            );
          } else {
            if (Number(result.status) === Number(UNVERIFIED)) {
              if (
                Number(result.Otp.otp) === Number(reqParam.verification_code)
              ) {
                if (Number(result.Otp.expiry) > Date.now()) {
                  User.update(
                    { status: ACTIVE },
                    { where: { id: Number(result.id) } }
                  )
                    .then(async () => {
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__("Verification successful."),
                        201
                      );
                    })
                    .catch((error) => {
                      return Response.errorResponseData(
                        res,
                        error,
                        res.locals.__("Something went wrong."),
                        500
                      );
                    });
                } else {
                  return Response.errorResponseWithoutData(
                    res,
                    res.locals.__("OTP expired.")
                  );
                }
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("Incorrect verification code.")
                );
              }
            } else {
              if (Number(result.status) === Number(ACTIVE)) {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("Email already verified."),
                  403
                );
              } else {
                return Response.errorResponseData(
                  res,
                  res.locals.__("Email already exist with different status."),
                  403
                );
              }
            }
          }
        });
      }
    } catch (err) {
      return Response.errorResponseData(
        res,
        err,
        res.__("Something went wrong.")
      );
    }
  },

  //  send mail to user to reset password
  forgotPassword: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      email: Joi.string().email().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Login validation", error))
      );
    } else {
      await User.findOne({
        where: {
          email: reqParam.email,
        },
        include: [{ model: Otp }],
      }).then(async (result) => {
        if (!result) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("Email not found."),
            401
          );
        } else {
          // if (result.Otp !== null) {
          //     return Response.errorResponseWithoutData(res, res.locals.__("Email is already sent."))
          // }
          if (Number(result.status) === Number(UNVERIFIED)) {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("Email is not verified."),
              401
            );
          } else if (Number(result.status) === Number(ACTIVE)) {
            // let code = Math.floor(100000 + Math.random() * 900000);
            let code = 111111
          
            await Otp.create({
              userId: result.id,
              otp: code,
              otp_type: 1,
              email: result.email,
              expiry: Date.now() + 300000,
            })
              .then((createdOtp) => {
                sendMail(
                  result.email,
                  "Reset Password",
                  RESET_PASSWORD_TEMPLATE,
                  {
                    user: result.name,
                    otp: code,
                  }
                )
                .then( () => {
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__("Mail sent successfully."),
                    200
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
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("Something went wrong."),
              UNAUTHORIZED
            );
          }
        }
      });
    }
  },

  // verify otp sent to mail
  verifyForgotPassword: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      email: Joi.string().email().required(),
      verification_code: Joi.string().min(6).max(6).required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate({
      email: reqParam.email,
      verification_code: String(reqParam.verification_code),
    });
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation.", error))
      );
    } else {
      await User.findOne({
        where: {
          email: reqParam.email,
        },
        include: [{ model: Otp }],
        order: [[Otp, "id", "DESC"]],
      }).then(async (result) => {
        // console.log(result);
        if (!result) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("Email does not exist."),
            401
          );
        } else {
          if (Number(result.status) === Number(ACTIVE)) {
            if (Number(result.Otp.otp) === Number(reqParam.verification_code)) {
              if (Number(result.Otp.expiry) > Date.now()) {
                await Otp.update(
                  { verified: true },
                  {
                    where: {
                      id: Number(result.Otp.id),
                    },
                  }
                );
                return Response.successResponseData(
                  res,
                  { email: result.email },
                  res.locals.__("OTP verified successfully."),
                  201
                );
              } else {
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("OTP expired.")
                );
              }
            } else {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("Incorrect OTP.")
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__("unauthorized"),
              UNAUTHORIZED
            );
          }
        }
      });
    }
  },

  // sets new user password
  resetForgotPassword: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      email: Joi.string().email().required(),
      new_password: Joi.string()
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{4,50}$/)
        .required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    } else {
      await User.findOne({
        where: {
          email: reqParam.email,
        },
        include: [{ model: Otp }],
        order: [[Otp, "id", "DESC"]],
      }).then(async (result) => {
        if (!result) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("Email does not exist."),
            401
          );
        } else {
          if (Number(result.status) === Number(ACTIVE)) {
            if (result.Otp.verified === true) {
              const passwordHash = hashPassword(reqParam.new_password);
              // if (Number(result.Otp.expiry) > Date.now()) {
              await User.update(
                { password: passwordHash },
                {
                  where: {
                    id: Number(result.id),
                  },
                }
              );
              await Otp.update(
                { verified: 0 },
                {
                  where: {
                    id: result.Otp.id,
                  },
                }
              );
              return Response.successResponseData(
                res,
                { email: result.email },
                res.locals.__("Password reset successful."),
                201
              );
              // }
              // else {
              //     return Response.errorResponseWithoutData(res,res.locals.__('OTP expired'))
              // }
            } else {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__(
                  "Cannot reset password , try again with different otp."
                )
              );
            }
          } else {
            return Response.errorResponseWithoutData(
              res,
              res.locals__("unauthorized"),
              401
            );
          }
        }
      });
    }
  },

  // social login route
  socialLogin: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      social_login_type: Joi.number().required(),
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      social_login_id: Joi.string().required(),
      image: Joi.string().required(),
    };

    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Login validation", error))
      );
    } else {
      // console.log(reqParam.social_login_id)
      await User.findOne({
        where: {
          social_login_id: reqParam.social_login_id,
          status: {
            [Op.eq]: ACTIVE,
          },
        },
      }).then(
        async (user) => {
          if (user) {
            // console.log(user)
            const token = jwtToken.issueUser({
              id: user.id,
              email: user.email,
            });
            // console.log(ACTIVE);
            user.reset_token = token;
            if (user.social_login_id === reqParam.social_login_id) {
              // console.log("user.status :: ");
              if (Number(user.status) === ACTIVE) {
                await user.save().then(
                  async (updateData) => {
                    if (updateData) {
                      // console.log(" :: updateData : :", updateData);

                      updateData = {
                        id: updateData.id,
                        name: updateData.name,
                        email: updateData.email,
                        status: updateData.status,
                        reset_token: updateData.reset_token,
                        image: updateData.image,
                      };

                      return Response.successResponseData(
                        res,
                        updateData,
                        res.locals.__("Logged in successfully")
                      );
                    } else {
                      return Response.errorResponseWithoutData(
                        res,
                        res.__("Something went wrong")
                      );
                    }
                  },
                  (e) => {
                    Response.errorResponseWithoutData(
                      res,
                      res.__("Internal error"),
                      INTERNAL_SERVER
                    );
                  }
                );
              } else {
                Response.errorResponseWithoutData(
                  res,
                  res.locals.__("Account is inactive"),
                  UNAUTHORIZED
                );
              }
            } else {
              const updateObj = {
                social_login_id: reqParam.social_login_id,
                social_login_type: reqParam.social_login_type,
                reset_token: token,
              };
              await User.update(updateObj, {
                where: { social_login_id: reqParam.social_login_id },
              }).then(
                async (updateData) => {
                  if (updateData) {
                    var data = {
                      id: user.id,
                      email: user.email,
                      token: token,
                    };
                    return Response.successResponseData(
                      res,
                      data,
                      SUCCESS,
                      res.locals.__("Login success")
                    );
                  } else {
                    return Response.errorResponseWithoutData(
                      res,
                      res.locals.__("Something went wrong")
                    );
                  }
                },
                (e) => {
                  Response.errorResponseWithoutData(
                    res,
                    res.__("Internal error"),
                    INTERNAL_SERVER
                  );
                }
              );
            }
          } else {
            // console.log(user)
            //start else

            if (!reqParam.email || !reqParam.name) {
              return Response.errorResponseWithoutData(
                res,
                res.__("Email Or Name missing")
              );
            }

            let emailExistData = await User.findOne({
              where: {
                email: reqParam.email,
              },
            });
            if (emailExistData) {
              return Response.errorResponseWithoutData(
                res,
                res.locals.__("Email already Exist")
              );
            }

            const reqObj = {
              email: reqParam.email,
              name: reqParam.name,
              status: ACTIVE,
              social_login_id: reqParam.social_login_id,
              social_login_type: reqParam.social_login_type,
              image: reqParam.image,
            };
            await User.create(reqObj)
              .then(async (result) => {
                if (result) {
                  const token = jwtToken.issueUser({
                    id: result.id,
                    email: result.email,
                  });
                  result.reset_token = token;
                  result.save().then(
                    async (updateData) => {
                      if (updateData) {
                        updateData = {
                          id: updateData.id,
                          name: updateData.name,
                          email: updateData.email,
                          status: updateData.status,
                          image: updateData.image,
                          reset_token: updateData.reset_token,
                        };

                        return Response.successResponseData(
                          res,
                          updateData,
                          res.locals.__("User Added Successfully")
                        );
                      } else {
                        return Response.errorResponseWithoutData(
                          res,
                          res.locals.__("Something went wrong")
                        );
                      }
                    },
                    (e) => {
                      Response.errorResponseWithoutData(
                        res,
                        res.locals.__("Something went wrong")
                      );
                    }
                  );
                }
              })
              .catch((e) => {
                console.log("enter", e);
                return Response.errorResponseWithoutData(
                  res,
                  res.locals.__("Something went wrong")
                );
              });

            //end else
          }
        },
        (e) => {
          console.log("enter2", e);
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("Something went wrong")
          );
        }
      );
    }
  },

  // gets user feedback
  feedback: async (req, res, next) => {
    try {
      const reqParam = req.body;
      const reqObj = {
        userid: Joi.number().required(),
        title: Joi.string().min(4).max(25).required(),
        messege: Joi.string().optional(),
      };

      const schema = Joi.object(reqObj);
      const { error } = schema.validate(reqParam);
      if (error) {
        return Response.validationErrorResponseData(
          res,
          res.__(Helper.validationMessageKey("Login validation", error))
        );
      } else {
        const feedback = await Feedback.create(reqParam);
        if (feedback) {
          return Response.successResponseData(
            res,
            feedback,
            res.locals.__("Feedback submitted successfully"),
            201
          );
        } else {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__("Something went wrong "),
            500
          );
        }
      }
    } catch (error) {
      return Response.errorResponseData(
        res,
        error,
        res.locals.__("something went wrong"),
        400
      );
    }
  },

  // assign tags to the user
  assignTags: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      tagId: Joi.string().required(),
      tagname: Joi.string().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }

    // conveting input into array
    let tagIds = reqParam.tagId.split(",");
    tagIds = tagIds.map((val) => Number(val));
    let tagnames = reqParam.tagname.split(",");

    // checking length of both input arrays
    if (tagIds.length !== tagnames.length) {
      return Response.errorResponseWithoutData(
        res,
        res.locals.__("TagId and tagnames does not match."),
        BAD_REQUEST
      );
    }

    let fillArr = [];

    //  creating user_tags
    if (tagIds.length > 0) {
      tagIds.forEach(async (val, ind) => {
        fillArr.push({
          userId: req.authUserId,
          tagId: val,
          tagname: tagnames[ind],
        });
      });
      await user_tag.destroy({
        where: {
          userId: req.authUserId,
        },
      });
      await user_tag
        .bulkCreate(fillArr)
        .then((data) => {
          return Response.successResponseData(
            res,
            fillArr,
            res.locals.__("Tags assigned successfully."),
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
    return Response.successResponseWithoutData(
      res,
      res.locals.__("Tags already assigned.")
    );
  },

  // add fcm to the user
  addFCMtoken: async (req, res, next) => {
    const reqParam = req.body;
    const reqObj = {
      fcm_token: Joi.string().required(),
    };
    const schema = Joi.object(reqObj);
    const { error } = schema.validate(reqParam);
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey("Input validation", error))
      );
    }
    await User.findOne({
      where: {
        id: req.authUserId,
      },
    })
      .then(async (user) => {
        user.fcm_token = reqParam.fcm_token;
        user.save();

        return Response.successResponseWithoutData(
          res,
          res.locals.__("Token added successfully"),
          SUCCESS
        );
      })
      .catch((err) => {
        return Response.errorResponseData(
          res,
          err,
          res.locals.__("Something went wrong "),
          INTERNAL_SERVER
        );
      });
  },

  // api to get tags of a logged in user
  getUserTags: async (req, res, next) => {
    const userTags = await User.findAll({
      where: {
        id: req.authUserId,
      },
      include: [{ model: user_tag }],
    });
    if (userTags) {
      return Response.successResponseData(
        res,
        userTags[0].user_tags,
        res.locals.__("Tags fetched successfully."),
        SUCCESS
      );
    }
  },

};
