var router = require('express').Router();
const {
    createPage, showAll, createNotification
} = require('../../controllers/admin/notificationController')
const {validateAdmin} = require('../../middlewares/auth')

router.get('/createpage',validateAdmin,createPage)

router.post('/create',validateAdmin,createNotification)

router.get('/',validateAdmin,showAll)

module.exports = router