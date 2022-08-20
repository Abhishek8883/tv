require('dotenv').config()
var createError = require('http-errors');
const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
const i18n = require('./src/i18n/i18n')
var flash = require('express-flash');
var session = require('express-session')
const { v4: uuidv4 } = require('uuid');
uuidv4()


// admin
var adminRouter = require('./src/routes/admin/indexRoute')
var quizRouter = require('./src/routes/admin/quizRoute')
var notificationRouter = require('./src/routes/admin/notificationRoute')
var adRouter = require('./src/routes/admin/adRoute')


// user
var indexRouter = require('./src/routes/api/indexRoute');
var postRouter = require('./src/routes/api/postRoute');



const app = express();
// config express body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(process.env.base_url,function(req,res,next){
  res.send(process.env.base_url)
})

app.use(logger('dev'));
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 1)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.session_secret, 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true,maxAge:600000000000 }
}))
app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())
app.use(i18n)

app.use((req,res,next) => {
  console.log("op");
  console.log(req.flash('success'));
  res.locals.flashMesseges = req.flash('success');
  next()
})

// admin
app.use(process.env.base_url + '/admin',adminRouter)
app.use(process.env.base_url + '/admin/quiz',quizRouter)
app.use(process.env.base_url + '/admin/notification',notificationRouter)
app.use(process.env.base_url + '/admin/ad',adRouter)



// user
app.use(process.env.base_url + '/api/v1/user', indexRouter);
app.use(process.env.base_url + '/api/v1/post', postRouter);

app.use(function(req, res, next) {
  
    next(createError(404));
  }); 
  

// use error middleware

app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

app.listen(process.env.PORT, console.log('Listening on port',process.env.PORT));
