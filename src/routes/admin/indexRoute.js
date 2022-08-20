var router = require('express').Router();
const {validateAdmin} =require('../../middlewares/auth')
const {
    login,
    getLoginPage,
    getDashboard,
    showUsers,
    createUserPage,
    editUserPage,
    editUser,
    create,
    deleteUser,
    showDetails,
    showFeedback,
    showFeedbackDetail,
    Logout
} = require('../../controllers/admin/indexController')

/**
* @desc get admin login page
* @route GET /admin
* @access public
*/
router.get('/',getLoginPage);
/**
* @desc login
* @route GET /admin/login
* @access public
*/
router.post('/login',login);

/**
* @desc get  dashboard
* @route GET /admin/dashboard
* @access private
*/
router.get('/dashboard',validateAdmin,getDashboard);

/**
* @desc get users page
* @route GET /admin/showusers/:page
* @access private
*/
router.get('/showusers/:page',validateAdmin,showUsers);
/**
* @desc get users page
* @route GET /admin/showusers/:page
* @access private
*/
router.get('/createuser',validateAdmin,createUserPage);

/**
* @desc route to edit user
* @route GET /admin/edituser/:userid
* @access private
*/
router.post('/edituser/:userid',validateAdmin,editUser);

/**
* @desc get users page
* @route GET /admin/showusers/:page
* @access private
*/
router.get('/edituserpage/:userid',validateAdmin,editUserPage);


/**
* @desc get users page
* @route GET /admin/showusers/:page
* @access private
*/
router.post('/adduser',validateAdmin,create);

/**
* @desc get users page
* @route GET /admin/showusers/:page
* @access private
*/
router.get('/delete/:userid',validateAdmin,deleteUser);

/**
* @desc get users page
* @route GET /admin/showdetails/:userid
* @access private
*/
router.get('/showdetail/:userid',validateAdmin,showDetails);
/**
* @desc get users page
* @route GET /admin/showFeedbackDetail/:userid
* @access private
*/
router.get('/showFeedbackDetail/:feedbackid/:page',validateAdmin,showFeedbackDetail);

/**
* @desc get feedbacks
* @route GET /admin/showFeedback
* @access private
*/
router.get('/showfeedbacks/:page',validateAdmin,showFeedback);

router.get('/logout',Logout)

module.exports = router;
