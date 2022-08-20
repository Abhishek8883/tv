let Response = require("../../services/response");
const { Ad } = require("../../models");
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
  IMAGE,
  VIDEO,
  TEXT,
} = require("../../services/constant");
const base_url = process.env.base_url;
var Jimp = require("jimp");
const videoCompressor = require("video-compressor");
const axios = require("axios");

module.exports = {
  showAds: async (req, res, next) => {
    let p = req.params.page <= 0 || !req.params.page ? 1 : req.params.page;
    const page = Number(p);
    await Ad.findAndCountAll({
      limit: 10,
      offset: (page - 1) * 10,
    })
    .then( async (data) => {
        const isData = (() => {
            if (data.rows.length > 0) {
              return true;
            } else {
              return false;
            }
          })();
          const totalPages = Math.floor(data.count / 10.0000001) + 1;
         const nextPage = totalPages > page ? page + 1 : 0;
        const previousPage = page <= 1 ? 0 : page - 1;
        return res.render("ad/index", {
            ad: data.rows,
            count:data.count,
            page,
            previousPage,
            nextPage,
            isData,
            active: "ad",
          });
    })
    .catch( err => {
        return Response.errorResponseData(
                  res,
                  err,
                  res.locals.__("Something went wrong")
                );
    })

  },

  createPage: async (req, res, next) => {
    res.render("ad/create", { active: "ad" });
  },

  create: async (req, res, next) => {
    const reqParam = req.body;

    if (req.file) {
      const reqObj = {
        title: Joi.string().required(),
      };
      const schema = Joi.object(reqObj);
      const { error } = schema.validate({ title: reqParam.title });
      if (error) {
        return res.redirect(req.header("Referer"));
      } else {
        //  image ad
        let filetype = req.file.mimetype.split("/")[0];
        if (filetype === "image" && Number(req.body.adType) === IMAGE) {
          const compressed = await Jimp.read(
            `./public/ads/image/${req.file.filename}`
          )
            .then((image) => {
              return image
                .resize(250, 300)
                .quality(50)
                .write(`./public/ads/image/${req.file.filename}`);
            })
            .catch((err) => {
              console.error(err);
            });

          const ad = await Ad.create({
            title: reqParam.title,
            adType: Number(reqParam.adType),
            content: req.file.filename,
          })
            .then((createdAd) => {
              return Response.successResponseData(
                res,
                createdAd,
                res.locals.__("Ad created successfully")
              );
            })
            .catch((err) => {
              return Response.errorResponseData(
                res,
                err,
                res.locals.__("Internal server error"),
                500
              );
            });
        }

        // video ad
        else if (filetype === "video" && Number(req.body.adType) === VIDEO) {
          const compressed = videoCompressor(
            `./public/ads/image`,
            `./public/ads/video`
          );
          const ad = await Ad.create({
            title: reqParam.title,
            adType: Number(reqParam.adType),
            content: req.file.filename,
          })
            .then((createdAd) => {
              return Response.successResponseData(
                res,
                createdAd,
                res.locals.__("Ad created successfully")
              );
            })
            .catch((err) => {
              return Response.errorResponseData(
                res,
                err,
                res.locals.__("Internal server error"),
                500
              );
            });
        }

        //  text ad
        else {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__(
              "Selcted ad type and uploaded file type does not match."
            ),
            400
          );
        }
      }
    } else {
      const reqObj = {
        title: Joi.string().required(),
        adType: Joi.number().integer().required(),
        content: Joi.string().required(),
      };
      const schema = Joi.object(reqObj);
      const { error } = schema.validate({
        title: reqParam.title,
        adType: Number(reqParam.adType),
        content: reqParam.content,
      });
      if (error) {
        return res.redirect(req.header("Referer"));
      } else {
        const ad = await Ad.create({
          title: reqParam.title,
          adType: Number(reqParam.adType),
          content: reqParam.content,
        })
          .then((createdAd) => {
            return Response.successResponseData(
              res,
              createdAd,
              res.locals.__("Ad created successfully")
            );
          })
          .catch((err) => {
            return Response.errorResponseData(
              res,
              err,
              res.locals.__("Internal server error"),
              500
            );
          });
      }
    }
  },

  DeleteAd: async (req,res,next) => {
    const adId = Number(req.params.adId);
    await Ad.destroy({
      where: {
        id: adId,
      },
    })
      .then(async () => {
          return res.redirect(req.header("Referer"))
      })
      .catch((err) => {
        return Response.errorResponseData(
          res,
          err,
          res.locals.__("Something went wrong")
        );
      });
  },
};
