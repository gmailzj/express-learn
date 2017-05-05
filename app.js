var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var mysql = require('mysql');

var app = express();

var session = require('express-session');
// 终端http请求格式
//app.use(logger('This is a customer format. :method :url :status :response-time ms'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// session
app.use(session({
    secret: 'abcdef', //secret的值建议使用随机字符串
    cookie: {maxAge: 60 * 1000 * 30}, // 过期时间（毫秒）
    resave: false,
    saveUninitialized: true,
}));

// app.use(function(req, res, next) {
//     mysql.createConnection({
//       host     : 'localhost',
//       user     : 'root',
//       password : '',
//       database : 'nodejs'
//     }, function(err, db) {
//         if (err) return next(err);
//         req.db = db;
//         next();
//     })
// })


// 定义静态资源
app.use(express.static(path.join(__dirname, 'public')));

// 没有挂载路径的中间件，应用的每个请求都会执行该中间件
app.use(function (req, res, next) {
  console.log('Time:', Date.now());
  next();
});

// 挂载至 /user/:id 的中间件，任何指向 /user/:id 的请求都会执行它
// app.use('/fib', function (req, res, next) {
//   console.log('Request URL:', req.originalUrl);
//   console.log('Request Type:', req.method);
//   next();
// });


// app.use('/fib', function (req, res, next) {
//   console.log('Request URL2:', req.originalUrl);
//   next();
// }, function (req, res, next) {
//   console.log('Request Type2:', req.method);
//   next();
// });

// app.get('/fib', function (req, res, next) {
//   console.log('ID:', req.query.n);
//   next();
// }, function (req, res, next) {
//   res.send('User Info');
// });

// 一个中间件栈，处理指向 /user/:id 的 GET 请求
// app.get('/fib', function (req, res, next) {
//   // 如果 user id 为 0, 跳到下一个路由
//   if (req.query.n == 0) next('route');
//   // 否则将控制权交给栈中下一个中间件
//   else next(); //
// }, function (req, res, next) {
//   // 渲染常规页面
//   res.send('regular');
// });
// // 处理  渲染一个特殊页面
// app.get('/fib', function (req, res, next) {
//   res.send('special');
// });

app.use('/', routes);
app.use('/users', users);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
//console.log(app.get('env'),process.env);

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
