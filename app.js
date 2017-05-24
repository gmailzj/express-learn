var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require("fs");
var fileStreamRotator = require('file-stream-rotator');
var uuid = require('uuid');

// 全局变量
//  根目录
global.app_path = __dirname;

// 下面的模块有用到上面的全局变量
var routes = require('./routes/index');
var users = require('./routes/users');

var mysql = require('mysql');

var app = express();

//console.log(app.locals);



var session = require('express-session');
// var RedisStrore = require('connect-redis')(session);

// 定义静态资源访问
app.use(express.static(__dirname + '/public'));

// 终端http请求格式
// app.use(logger('This is a customer format. :method :url :status :response-time ms'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* Boolean
If true, the client's IP address is understood as the left-most entry in the X-Forwarded-* header.
If false, the app is understood as directly facing the Internet and the client's IP address is derived from req.connection.remoteAddress. This is the default setting.
*/
app.set('trust proxy', true)
    /* IP addresses
An IP address, subnet, or an array of IP addresses, and subnets to trust. The following is the list of pre-configured subnet names.
loopback - 127.0.0.1/8, ::1/128
linklocal - 169.254.0.0/16, fe80::/10
uniquelocal - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7
The IP addresses can be set in the following ways.
app.set('trust proxy', 'loopback') // specify a single subnet
app.set('trust proxy', 'loopback, 123.123.123.123') // specify a subnet and an address
app.set('trust proxy', 'loopback, linklocal, uniquelocal') // specify multiple subnets as CSV
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']) // specify multiple subnets as an array
  */
    //app.set('trust proxy', 'loopback')

/* Number
Number	Trust the nth hop from the front-facing proxy server as the client.
*/
/* Function
Function Custom trust implementation.Use this only
if you know what you are doing.
app.set('trust proxy', function(ip) {
    if (ip === '127.0.0.1' || ip === '123.123.123.123') return true; // trusted IPs
    else return false;
})
*/
//env Environment mode, defaults to process.env.NODE_ENV (NODE_ENV environment variable) or "development".


//app.set("case sensitive routing", true)
app.enable("case sensitive routing");
// console.log(app.get("case sensitive routing"))
// console.log(app.enabled("case sensitive routing"))

//  设置jsonp的参数key，默认为callback
app.set("jsonp callback name", "callback");
app.disable("x-powered-by")

// strict routing   启用/禁用严格的路由，如/home和/home/是不一样的，默认为disabled
// view cache  启用/禁用视图模板编译缓存，默认为enabled
// view engine    指定呈现模板时，如果从视图中省略了文件扩展名，应该使用的默认模板引擎扩展
// views       指定模板引擎用来查找视图模板的路径，默认值是./views

// 用户自定义配置
app.set("title", "abc");
//console.log(app.get("title"))

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// 写到日志文件里面
// var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })


// 按每天新建一个日志文件
var logDir = path.join(__dirname, 'logs');
// ensure log directory exists
// fs.existsSync(logDir) || fs.mkdirSync(logDir);
// create a rotating write stream
// var accessLogStream = fileStreamRotator.getStream({
//     date_format: 'YYYYMMDD',
//     filename: path.join(logDir, 'access-%DATE%.log'),
//     frequency: 'daily',
//     verbose: true
// });
// app.use(logger('combined', { stream: accessLogStream }))

// 日志添加自定义字段
// logger.token('id', function(req) {
//     return req.id;
// });

// function assignId(req, res, next) {
//     req.id = uuid.v4();
//     next();
// };

// app.use(assignId);
// app.use(logger(':id :method :url :response-time ms'));

// 在终端中显示访问日志
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// session
app.use(session({
    secret: 'abcdef', //secret的值建议使用随机字符串
    cookie: { maxAge: 60 * 1000 * 30 }, // 过期时间（毫秒）
    resave: false,
    saveUninitialized: true,
    key: "PHPSESSID"
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
app.use(function(req, res, next) {
    console.log('Time:', Date.now());
    next();
});



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

// 设置路由信息

app.use(function(req, res, next) {
    console.log("all request middlewares")

    // 设置编码
    // res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
})
app.use('/', routes);
app.use('/users', users);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
//console.log(app.get('etag'));

// development error handler
// will print stacktrace
// app.get('env'), 获取当前用户环境变量中NODE_ENV值；
// NODE_ENV=development node  ./bin/www
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log(err.message);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });

    //下面的错误就不会触发了
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log(err.message);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// 测试代码
// NODE_ENV 如果没有设置的时候默认为 development
console.log(app.get("env"))
console.log(process.env.NODE_ENV);
console.log(global.app_path);
module.exports = app;