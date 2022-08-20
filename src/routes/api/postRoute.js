var router = require('express').Router()

const {
    createComment,
    createReply,
    postLike,
    commentLike,
    getPostData,
    markRead,
    getReadStatus,
    shareArticle,
} = require('../../controllers/api/postController')

const {commonAuth} = require('../../middlewares/auth')

router.post('/create-comment',commonAuth,createComment)

router.post('/create-reply',commonAuth,createReply)

router.get('/get-data',commonAuth,getPostData)

router.post('/like-post',commonAuth,postLike)

router.post('/like-comment',commonAuth,commentLike)

router.post('/mark-read',commonAuth,markRead)

router.get('/read-status',commonAuth,getReadStatus)

router.post('/share-article',shareArticle)


module.exports = router