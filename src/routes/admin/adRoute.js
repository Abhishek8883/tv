var router = require('express').Router();
const multer  = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/ads/image')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null,uniqueSuffix + file.originalname )
    }
  })
  
const upload = multer({ storage: storage })

const {
    createPage, 
    create,
    showAds,
    DeleteAd,
} = require('../../controllers/admin/adController'); 

router.get('/createpage',createPage)

router.post("/create",upload.single('file'),create)

router.get('/showAll/:page',showAds)

router.get('/delete/:adId',DeleteAd)

module.exports = router