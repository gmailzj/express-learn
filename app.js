const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
let logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const responseTime = require('response-time');
const domain = require("domain");

// const fs = require('fs');
// const fileStreamRotator = require('file-stream-rotator');
// const uuid = require('uuid');
// const config = require('config');

// 设置全局变量
//  根目录
global.app_path = __dirname;

// 如果是开发环境，重写console便于调试 可以显示文件和行号
require('debug-trace')({
    always: true
});

// 读取公共数据  1种是用户配置文件  2种全局变量
// const dbConfig = config.get('Customer.dbConfig');
// console.log(dbConfig);


// 下面的模块有用到上面的全局变量
const routes = require('./routes/index');
const users = require('./routes/users');
const routeRedis = require('./routes/redis');
const routeMysql = require('./routes/mysql');

// const mysql = require('mysql');

const app = express();

// app.locals The app.locals object is a JavaScript object, and its properties are local variables within the application
// 设置app.locals变量，数据可以通过这个来传递、读取
app.locals.title = 'app-title-app.locals';


// app.locals.strftime = require('strftime');
app.locals.email = 'me@myapp.com';
// console.log(app.locals);

const strftime = require('strftime');

console.log(strftime('%B %d, %Y %H:%M:%S')); // => April 28, 2011 18:21:08
// console.log(strftime('%F %T', new Date(1307472705067))); // => 2011-06-07 18:51:45

const session = require('express-session');
// var RedisStrore = require('connect-redis')(session);

// app.use((req, res, next) => {
//     const reqDomain = domain.create();
//     // next抛出的异常在这里被捕获,触发此事件
//     reqDomain.on('error', e => {
//         // ... 这里统一处理错误，比如渲染或跳转到404，500页面
//     });
//     return reqDomain.run(next);
// });

// 使用domain 来处理异常
// app.use(function(req, res, next) {
//     let d = domain.create();
//     // 监听domain的错误事件
//     d.on('error', function(err) {
//         // 记录到日志 未实现
//         // console.error(err.messag);
//         res.statusCode = 500;
//         res.json({ sucess: false, messag: '服务器异常' });
//         d.dispose();
//     });

//     d.add(req);
//     d.add(res);
//     d.run(next);
// });

// 发送响应头 本次请求花费时间
app.use(responseTime());

// 定义静态资源访问
app.use(express.static(path.resolve(__dirname, '/public')));

// 终端http请求格式
// app.use(logger('This is a customer format. :method :url :status :response-time ms'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* Boolean
If true, the client's IP address is understood as the left-most entry in the X-Forwarded-* header.
If false, the app is understood as directly facing the Internet and
the client's IP address is derived from req.connection.remoteAddress. This is the default setting.
*/
app.set('trust proxy', true);
/** IP addresses
 * An IP address, subnet, or an array of IP addresses, and subnets to trust.
The following is the list of pre-configured subnet names.
loopback - 127.0.0.1/8, ::1/128
linklocal - 169.254.0.0/16, fe80::/10
uniquelocal - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7
The IP addresses can be set in the following ways.
app.set('trust proxy', 'loopback') // specify a single subnet
app.set('trust proxy', 'loopback, 123.123.123.123') // specify a subnet and an address
app.set('trust proxy', 'loopback, linklocal, uniquelocal') // specify multiple subnets as CSV
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']) // specify multiple subnets as an array
 */

// app.set('trust proxy', 'loopback')

// Number   Trust the nth hop from the front-facing proxy server as the client.

/* Function
Function Custom trust implementation.Use this only
if you know what you are doing.
app.set('trust proxy', function(ip) {
    if (ip === '127.0.0.1' || ip === '123.123.123.123') return true; // trusted IPs
    else return false;
})
*/
// env Environment mode, defaults to process.env.NODE_ENV (NODE_ENV environment variable) or "development".


// app.set("case sensitive routing", true)
app.enable('case sensitive routing');
// console.log(app.get("case sensitive routing"))
// console.log(app.enabled("case sensitive routing"))

//  设置jsonp的参数key，默认为callback
app.set('jsonp callback name', 'callback');
app.disable('x-powered-by')

// strict routing   启用/禁用严格的路由，如/home和/home/是不一样的，默认为disabled
// view cache  启用/禁用视图模板编译缓存，默认为enabled
// view engine    指定呈现模板时，如果从视图中省略了文件扩展名，应该使用的默认模板引擎扩展
// views       指定模板引擎用来查找视图模板的路径，默认值是./views

// 用户自定义配置
app.set("title", "abc");
// console.log(app.get("title"))

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// 写到日志文件里面
// var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })


// 按每天新建一个日志文件
// const logDir = path.join(__dirname, 'logs');
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

// log4js 日志
// const log4js = require('log4js');

// log4js.configure({
//     appenders: [
//         // 控制台输出
//         { type: 'console' },
//         {
//             // 文件输出
//             type: 'file',
//             filename: 'logs/access.log',
//             maxLogSize: 1024,
//             backups: 3,
//             category: 'normal',
//         }
//     ]
// });
// logger = log4js.getLogger('normal');
// logger.setLevel('INFO');
// app.use(log4js.connectLogger(logger, { level: log4js.levels.INFO }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// session
app.use(session({
    secret: 'abcdef', //  secret的值建议使用随机字符串
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

// 所有的请求都要通过个中间件
app.use(function(req, res, next) {
    res.setHeader('ver', '1.0.0');
    // 设置编码
    // res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
})

// 配置路由
app.use('/', routes);
app.use('/users', users);
app.use('/redis', routeRedis);
app.use('/mysql', routeMysql);

// 异常处理
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    console.log("404")
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
// app.get('env'), 获取当前用户环境变量中NODE_ENV值；
// NODE_ENV=development node  ./bin/www
// 如果是开发环境，则向页面输出错误堆栈信息，同时下面的错误中间件就不会触发了
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) { // next 参数很关键，如果没有，页面的错误会没有样式
        if (res.headersSent) {
            return next(err);
        }
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });

    // 下面的错误就不会触发了
}

// 如果是非开发环境，则向页面输出简单错误信息
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
    // if (res.headersSent) {
    //     next(err);
    // }
    res.status(err.status || 500);
    if (req.xhr) {
        res.status(500).send({ error: 'Something wrong!' });
    } else {
        res.render('error', {
            message: err.message,
            error: {}
        });
    }
});


// 测试代码
// NODE_ENV 如果没有设置的时候默认为 development
// console.log(app.get("env"))
// console.log(process.env.NODE_ENV);
// console.log(global.app_path);
module.exports = app;