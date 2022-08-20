let Response = require('../../services/response')
const { hashPassword, comparepassword } = require('../../utils/bcrypt')
const { Admin, User, Feedback, Quiz, Option , user_tag  } = require('../../models')
const { Op } = require('sequelize')
let Helper = require('../../services/helper')
const Joi = require('joi')
const jwtToken = require('../../services/jwtToken')
const { ACTIVE, DELETE, UNVERIFIED, UNAUTHORIZED, INTERNAL_SERVER, SUCCESS, UPDATE } = require('../../services/constant')
const base_url = process.env.base_url


module.exports = {
    getLoginPage: (req, res, next) => {
        res.render('login/index', { active: "" })
    },

    // renders dashboard
    getDashboard: async (req, res, next) => {

        try {
            const { count } = await User.findAndCountAll()
            const totalQuiz = await Quiz.count()
            const totalFeedback = await Feedback.count()
            return res.render('dashboard/index', { count, totalQuiz, totalFeedback, active: "dashboard" })

        } catch (error) {
            return Response.errorResponseData(res, error, res.locals.__('Something went wrong'), 400)
        } 

    },

    // renders user index page
    showUsers: async (req, res, next) => {
        console.log("shabby");
        console.log(res.locals);
        let p = (req.params.page <= 0 || !req.params.page) ? 1 : req.params.page
        let page = Number(p)
        const users = await User.findAndCountAll({
            include:[{model:user_tag}],
            limit: 10,
            offset: ((page - 1) * 10)
        })
        const isData = (() => {
            if (users.rows.length > 0) {
                return true
            }
            else {
                return false
            }
        })()
        if (users) {
            const totalPages = Math.floor(users.count / 10.000001) + 1
            const nextPage = (totalPages > (page)) ? ((page) + 1) : 0
            const previousPage = (page <= 1) ? 0 : page - 1


            console.log("::::::messege ::::::",req.flash());


            return res.render('user/index', { users: users.rows, count: users.count, page, previousPage, nextPage, isData, active: "user" })
        }
        else {
            return Response.errorResponseWithoutData(res, res.locals.__('Internal server error'), 500)
        }
    },

    //  renders page to create user
    createUserPage: (req, res, next) => {
        res.render('user/create', { active: "user" })
    },

    // creates user
    create: async (req, res, next) => {
        const reqParam = req.body
        const reqObj = {
            username: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{4,50}$/).required(),
            confirm_password: Joi.any().valid(Joi.ref("password")).required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            // req.flash('formValue', reqParam);
            // req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
        } else {
            await User.create({
                name: reqParam.username, email: reqParam.email, password: hashPassword(reqParam.password), status: ACTIVE,confirm_password:reqParam.confirm_password
            })
            .then(async user => {
            const token = await jwtToken.issueUser({ id: user.id, email: reqParam.email })
            await User.update({
                reset_token: token
            }, {
                where: {
                    email: reqParam.email
                }
            })
            .then( () => {
                return res.redirect(base_url + '/admin/showusers/1')
            })
        })
            .catch( err => {
                return Response.errorResponseData(res,err, res.locals.__("Something went wrong"), 500)

            })
        }
    },

    // delete user
    deleteUser: async (req, res, next) => {
        // req.flash('success','User deleted successfuly.')
        // console.log("abc");
        // console.log(req.flash('success'));
        // console.log("::::::messege1::::::");
        try {
            const userid = Number(req.params.userid)
            const deletedUser = await User.update({
                status: DELETE
            }, {
                where: {
                    id: userid
                }
            });
            // req.flash('success','User deleted successfuly.')
            // console.log("::::::messege2::::::",req.flash('success'));
            if (deletedUser) {
                req.flash('success','User deleted successfuly.')
                console.log("::::::messege3::::::",req.flash('success'));
                return res.redirect("back");
            }
        } catch (error) {
            return Response.errorResponseData(res, error, res.locals.__('Something went wrong'), 400)
        }
    },

    showDetails: async (req, res, next) => {
        try {
            const userid = Number(req.params.userid)
            const foundUser = await User.findOne({
                where: {
                    id: userid
                }
            })
            if (foundUser) {
                return res.render('user/details', { foundUser, active: "user" })
            }

        } catch (error) {
            return Response.errorResponseData(res, error, res.locals.__('something went wrong'), 500)
        }
    },

    editUserPage: async (req, res, next) => {
        try {
            const userid = Number(req.params.userid)
            const foundUser = await User.findOne({
                where: {
                    id: userid
                }
            })
            if (foundUser) {
                // res.send(foundUser)
                return res.render('user/edit', { foundUser, active: 'user' })
            }

        } catch (err) {
            return Response.errorResponseData(res, err, res.locals.__('Something went wrong'), 400)
        }
    },

    editUser: async (req, res, next) => {
        try {
            const userid = Number(req.params.userid)
            const reqParam = req.body
            const reqObj = {
                name: Joi.string().required(),
                email: Joi.string().email().required(),
                status: Joi.number().integer().less(4).required(),
            }
            const schema = Joi.object(reqObj)
            const { error } = schema.validate(reqParam)
            if (error) {
                req.flash('formValue', reqParam);
                req.flash('error', 'please fill the field : ', error.details[0].message);
                return res.redirect(req.header('Referer'))
            } else {
                const editedUser = await User.update({
                    name: reqParam.name, email: reqParam.email, status: reqParam.status
                },
                    {
                        where: {
                            id: userid
                        }
                    })
                return res.redirect(base_url + '/admin/showusers/1')
            }


        } catch (error) {
            return Response.errorResponseData(res, error, res.locals.__('something went wrong'))
        }
    },

    showFeedback: async (req, res, next) => {
        try {
            let p = (req.params.page <= 0 || !req.params.page) ? 1 : req.params.page
            let page = Number(p)
            const feedbacks = await Feedback.findAndCountAll({
                include: [{ model: User }],
                limit: 10,
                offset: ((page - 1) * 10)
            })
            // return res.send(feedbacks)   
            const isData = (() => {
                if (feedbacks.rows.length > 0) {
                    return true
                }
                else {
                    return false
                }
            })()
            const totalPages = Math.floor(feedbacks.count / 10) + 1
            const nextPage = (totalPages > (page)) ? ((page) + 1) : 0
            const previousPage = (page <= 1) ? 0 : page - 1

            return res.render('feedback/index', { feedbacks: feedbacks.rows, count: feedbacks.count, page, previousPage, nextPage, isData, active: "feedback" })
        } catch (err) {
            return Response.errorResponseData(res, err, res.locals.__('Something went wrong '), 400)
        }
    },

    showFeedbackDetail: async (req, res, next) => {
        try {
            const feedbackid = Number(req.params.feedbackid)
            const page = Number(req.params.page)
            const feedback = await Feedback.findOne({
                where: {
                    id: feedbackid
                },
                include: [{ model: User }]
            })
            // res.send(feedback)
            return res.render('feedback/details', { feedback, page, active: 'feedback' })
        } catch (error) {
            return Response.errorResponseData(res, error, res.locals.__('something went wrong'), 500)
        }
    },

    login: async (req, res) => {
        const reqParam = req.body
        const reqObj = {
            username: Joi.string().required(),
            password: Joi.string().required(),
        }
        const schema = Joi.object(reqObj)
        const { error } = schema.validate(reqParam)
        if (error) {
            req.flash('formValue', reqParam);
            req.flash('error', 'please fill the field : ', error.details[0].message);
            return res.redirect(req.header('Referer'))
        } else {
            let user;
            user = await Admin.findOne({
                where: {
                    [Op.or]: [
                        { username: reqParam.username },
                        { email: reqParam.username }
                    ]
                }
            })
            if (user) {
                const validate = comparepassword(reqParam.password, user.password)
                if (!validate) {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Email password not match');
                    return res.redirect(req.header('Referer'))
                    // return res.send('Email password not match')
                }
                if (validate) {
                    const token = jwtToken.issueUser({
                        id: user.id,
                    })
                    user.reset_token = token
                    Admin.update({ reset_token: token }, {
                        where: {
                            email: user.email
                        }
                    }).then(async (updateData) => {
                        if (updateData) {
                            // session store
                            res.cookie('x-token', `Bearer ${token}`)
                            return res.redirect(base_url + '/admin/dashboard')
                            // return res.send(updateData)
                        } else {
                            req.flash('formValue', reqParam);
                            req.flash('error', 'Something went wrong');
                            return res.redirect(req.header('Referer'))
                            // return res.send('Something went wrong')
                        }
                    }, (e) => {
                        req.flash('formValue', reqParam);
                        req.flash('error', 'Internal error');
                        return res.redirect(req.header('Referer'))
                        // return res.send('Internal error')
                    })
                } else {
                    req.flash('formValue', reqParam);
                    req.flash('error', 'Username/e-mail password not match');
                    return res.redirect(req.header('Referer'))
                    // return res.send('Username/e-mail password not match')
                }
                return null
            } else {
                req.flash('formValue', reqParam);
                req.flash('error', 'Username not exist');
                return res.redirect(req.header('Referer'))
                // return res.send('Username not exist')
            }
        }
    },

     Logout : (req, res, next) => {
        return res
            .clearCookie("x-token")
            .status(200)
            .redirect(base_url+'/admin');
    }
}
