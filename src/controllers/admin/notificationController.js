let Response = require('../../services/response')
const { hashPassword, comparepassword } = require('../../utils/bcrypt')
const { Admin, User, Feedback, Quiz, Option , Notification , notification_tag } = require('../../models')
const { Op } = require('sequelize')
let Helper = require('../../services/helper')
const Joi = require('joi')
const jwtToken = require('../../services/jwtToken')
const { ACTIVE, DELETE, UNVERIFIED, UNAUTHORIZED, INTERNAL_SERVER, SUCCESS, UPDATE } = require('../../services/constant')
const base_url = process.env.base_url
const axios = require('axios')


module.exports = {

    // show all notification and render notification page.
    showAll: async (req, res, next) => {
        await Notification.findAll({
            include:[{model:notification_tag}]
        })
        .then(async allNotifications => {
            res.render('notification/index', { active: "notification",allNotifications })
        })
        .catch(err => {
            return Response.errorResponseData(res,err,res.locals.__("Something went wrong"),INTERNAL_SERVER)
        })
    },


    // renders create notification page.
    createPage: async (req, res, next) => {
        await axios.get(`${process.env.web_url}/tags`)
            .then(async data => {
                let allTags = data.data
                return res.render('notification/create', { active: "notification",allTags})
            })
            .catch(error => {
                return Response.errorResponseData(res, error, res.locals.__("Somethig went wrong."), INTERNAL_SERVER)
            })

    },

    //  creates notification.
    createNotification:async (req,res,next) => {
        const reqParam = req.body
        const reqObj = {
            title: Joi.string().required(),
            content: Joi.string().required(),
            tags:Joi.array().required()
        }
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            return res.send(error)
            // req.flash('formValue', reqParam);
            // req.flash('error', 'please fill the field : ', error.details[0].message);
            // return res.redirect(req.header('Referer'))
        }
        if(reqParam.tags.length<=0){
           return  res.send("not tags")
            // req.flash('error', 'Select atleast one tag.');
            // return res.redirect(req.header('Referer'))
        }
        let idArr = []
        let nameArr = []
        let arr = []
        await Notification.create({
            title:reqParam.title,
            content:reqParam.content,
        })
        .then(async data => {
            reqParam.tags.forEach((val,ind) => {
            let value = val.split(',')
            console.log("::::value:::",value);
                idArr.push(Number(value[0]))
                nameArr.push(value[1])

             arr.push({
                    notificationId:data.id,
                    tagId:idArr[ind],
                    tagname:nameArr[ind]
                })
            })
            await notification_tag.bulkCreate(arr)
                .then(createdNotificationTags => {
                    return Response.successResponseData(res,{data,createdNotificationTags},res.locals.__('Notification added successfully.'),SUCCESS)
         })  
        })
        .catch(err => {
            return Response.errorResponseData(res,err,res.locals.__("Something went wrong"),INTERNAL_SERVER)
        })

    },
}