var router = require('express').Router();
const {validateAdmin} =require('../../middlewares/auth')
const {
    showAll,
    createQuizPage,
    createQuiz,
    Delete,
    getEditQuizPage,
    editQuiz
} = require('../../controllers/admin/quizController')


router.get('/showAll/:page',validateAdmin,showAll);


router.get('/createQuiz',validateAdmin,createQuizPage);

router.post('/create',validateAdmin,createQuiz);

router.get('/delete/:quizid',validateAdmin,Delete)

router.get('/editquizpage/:quizid',validateAdmin,getEditQuizPage)

router.post('/editquiz/:quizid',validateAdmin,editQuiz)



module.exports = router;