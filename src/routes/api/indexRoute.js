var router = require('express').Router();
const {
    login,
    signup,
    verifyEmail,
    forgotPassword,
    verifyForgotPassword,
    socialLogin,
    feedback,
    resetForgotPassword,
    assignTags,
    getUserTags,
   
} = require('../../controllers/api/indexController')

const { commonAuth } = require('../../middlewares/auth')


router.post('/login', login);


router.post('/signup', signup)

    
router.post('/verify', verifyEmail)


router.post('/forgot-password', forgotPassword)


router.post('/reset-forgot-password', resetForgotPassword)


router.post('/verify-forgot-password', verifyForgotPassword)


router.post('/social-login', socialLogin)


router.post('/feedback',commonAuth ,feedback)


router.post('/assignTags',commonAuth,assignTags)   


router.get('/get-user-tags',commonAuth,getUserTags)


module.exports = router;    
