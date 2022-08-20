const { User,Admin} = require('../models/index')
const jwtToken = require('../services/jwtToken')
const { ACTIVE, DELETE, INACTIVE, VERIFIED, UNVERIFIED } = require('../services/constant')
const Response = require('../services/response')


const commonAuth = async (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
        Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
    } else {
        const tokenData = await jwtToken.decode(token)
        if (tokenData) {
            jwtToken.verify(tokenData, (err, decoded) => {
                if (err) {
                    return Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                }
                if (decoded.id) {

                    req.authUserId = decoded.id;

                    User.findOne({
                        where: {
                            id: req.authUserId,
                        },
                    }).then((result) => {
                        // console.log(" :: userDetails:: ,", result);

                        if (!result) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        } else {
                            if (result && Number(result.status) === UNVERIFIED) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('accountNotVerified'),
                                    401
                                )
                            }
                            else if (result && Number(result.status) === INACTIVE) {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('accountIsInactive'),
                                    401
                                )
                            }
                            else if (result && Number(result.status) === ACTIVE) {
                                return next()
                            } 
                            else {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('accountBlocked'),
                                    401
                                )
                            }
                        }
                    })
                } else {
                    Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                }
            })
        } else {
            Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
        }
    }
}


const validateAdmin =  async(req, res, next) => {
    const token  = req.cookies['x-token'];
    if (!token) {
        Response.errorResponseData(res, res.locals.__('authorizationError'), 401)
    } else {
        const tokenData = await jwtToken.decode(token)
        if (tokenData) {
            jwtToken.verify(tokenData, (err, decoded) => {
                if (err) {
                    Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                }
                if (decoded.id) {
                    req.authUserId = decoded.id
                    Admin.findOne({
                        where: {
                            id: req.authUserId,
                        },
                    }).then((result) => {
                        if (!result) {
                            return Response.errorResponseData(
                                res,
                                res.locals.__('invalidToken'),
                                401
                            )
                        } else {
                            if (result) {
                                return next()
                            } else {
                                return Response.errorResponseData(
                                    res,
                                    res.locals.__('accountBlocked'),
                                    401
                                )
                            }
                        }
                    })
                } else {
                    Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
                }
            })
        } else {
            Response.errorResponseData(res, res.locals.__('invalidToken'), 401)
        }
    }
}


module.exports = { commonAuth,validateAdmin }