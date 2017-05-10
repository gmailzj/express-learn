var express = require('express');
var router = express.Router();
var fs = require("fs");
const path = require('path');
var main = require('../main');
var eventproxy = require('eventproxy');
var moment = require("moment");

// 没有挂载路径的中间件，通过该路由的每个请求都会执行该中间件
router.use(function(req, res, next) {
    console.log('router-middlewares Time:', Date.now());
    console.log(__filename)
    next();
});

// 一个中间件栈，显示任何指向 /user/:id 的 HTTP 请求的信息
router.use('/user/:id', function(req, res, next) {
    console.log('Request URL:', req.originalUrl);
    // res.json(req.params);
    next();
}, function(req, res, next) {
    console.log('Request Type:', req.method);
    next();
});

// 一个中间件栈，处理指向 的 GET 请求
router.get('/user/:id', function(req, res, next) {
    // 如果 user id 为 0, 跳到下一个路由   // 分支1
    if (req.params.id == 0) next('route');
    // 负责将控制权交给栈中下一个中间件 // 分支2
    // 渲染常规页面  //  分支2 'a'|'b' == 'c'
    res.write('regular' + Date.now() + "\n" + new Date().getTime() + "\n" + process.uptime() + "\n");
    moment.locale('zh-cn')
    res.write(moment("20170430", "YYYYMMDD").fromNow())
    res.end()
});

// 处理渲染一个特殊页面 // 分支1
router.get('/user/:id', function(req, res, next) {
    console.log(req.params.id);
    res.send('special');
});

router.get('/fib', function(req, res, next) {
    // http 传来的东西默认都是没有类型的，都是 String，所以我们要手动转换类型
    var n = Number(req.query.n);
    try {
        // 为何使用 String 做类型转换，是因为如果你直接给个数字给 res.send 的话，
        // 它会当成是你给了它一个 http 状态码，所以我们明确给 String
        res.send(String(main.fibonacci(n)));
    } catch (e) {
        // 如果 fibonacci 抛错的话，错误信息会记录在 err 对象的 .message 属性中。
        // 拓展阅读：https://www.joyent.com/developers/node/design/errors
        res
            .status(500)
            .send(e.message);
    }
});

router.get('/mysql', function(req, res, next) {
    // http 传来的东西默认都是没有类型的，都是 String，所以我们要手动转换类型
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'nodejs'
    });

    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }

        console.log('connected as id ' + connection.threadId);
    });

    // 查询
    connection.query('SELECT 1 + 1 AS solution', function(error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
    });

    connection.end();

    res.send("mysql")
});


router.get('/fs', function(req, res, next) {
    //console.log(__dirname, process.cwd(),process.execPath);
    // /Users/zhoujian/Web/Nodejs/express/learn/routes 
    // /Users/zhoujian/Web/Nodejs/express/learn 
    // /usr/local/bin/node

    var appPath = process.cwd();
    var proxy = new eventproxy();
    proxy.fail(next);

    var debug = require('debug')('learn:server');

    var renderData = {};
    fs.readFile(appPath + '/t1.txt', 'utf8', proxy.done('r1', function(data1) {
        console.log(Date.now())
        return data1;
    }));
    fs.readFile(appPath + '/t2.txt', 'utf8', proxy.done('r2', function(data2) {
        console.log(Date.now())
        return data2;
    }));
    proxy.all('r1', 'r2', function(data1, data2) {
        console.log(data1, data2)
        renderData['data1'] = data1;
        renderData['data2'] = data2;
        res.render('fs', renderData);
    })


    //res.render("fs");
});

router.get('/fs2', function(req, res, next) {

    var appPath = process.cwd();
    var ep = new eventproxy();
    ep.fail(next);


    var renderData = {};
    renderData['data1'] = '1';
    renderData['data2'] = '2';


    ep.tail('tpl', 'data', function(tpl, data) {
        // 在所有指定的事件触发后，将会被调用执行 
        // 参数对应各自的事件名的最新数据 

    });

    fs.readFile(appPath + '/t1.txt', 'utf-8', function(err, content) {
        ep.emit('tpl', content);
    });

    fs.readFile(appPath + '/t2.txt', 'utf-8', function(err, content) {
        ep.emit('data', content);
    });


    res.render("fs", renderData);
});


router.get('/', function(req, res, next) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});
/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session && req.session.sign) { //检查用户是否已经登录
        //console.log(req.session); //打印session的值
    } else {
        //验证权限
        req.session.sign = true;
        req.session.name = 'session-name'
    }
    //res.render('index', { title: 'Express' });
    res.write('hello')
    res.end();
});

// router.get('/*', function(req, res, next) {
//     if (req.session && req.session.sign) { //检查用户是否已经登录
//         console.log(req.session); //打印session的值
//     } else {
//         //验证权限
//         req.session.sign = true;
//         req.session.name = 'session-name'
//     }
//     res.render('index', { title: 'Express' });
// });

module.exports = router;