const express = require('express');

const router = express.Router();
const fs = require("fs");
const path = require('path');
const main = require('../main');

const Eventproxy = require('eventproxy');
const debug = require('debug')('learn:*');
const moment = require("moment");
const redis = require('redis');
const mysql = require('mysql');
const querystring = require('querystring');
// const request = require('request');

// const config = require('config');

const app_path = global.app_path;

// // 读取公共数据  1种是用户配置文件  2种全局变量
// const dbConfig = config.get('Customer.dbConfig');
// const utils = require(path.resolve(app_path, "./modules/utils"));
var common = require(path.resolve(app_path, "./modules/common"));
common.config = {};
// console.log(common);


// 没有挂载路径的中间件，通过该路由的每个请求都会执行该中间件
router.use(function(req, res, next) {
    debug('router-middlewares Time:', Date.now());
    // res.locals.title = 'app-title-res.locals-middleware';
    next();
});

// router.get('/', function(req, res, next) {
//     res.setHeader('Content-Type', 'text/html; charset=utf-8');
//     next();
// });

/* GET home page. */
router.get('/', function(req, res) {
    if (req.session && req.session.sign) { //  检查用户是否已经登录
        // console.log(req.session); //打印session的值
    } else {
        // 验证权限
        req.session.sign = true;
        req.session.name = 'session-name'
    }
    res.render('index', { title: 'Express' });
    // res.type('.html');
    // res.write('hello')
    // res.end();
    // res.status(403).end('403 forbidden');
    // res.status(400).send('Bad Request');
    // res.status(404).sendFile('/absolute/path/to/404.png');

});

router.get("/test", function(req, res) {
    res.end('test');
})

router.get("/200", function(req, res) {
    var ok = req.params.ok;
    // throw new Error('Catch me');
    res.send('200');
});
router.get("/about", function(req, res) {
    /**
     * 调用 res.render 的时候，express 合并（merge）了 3 处的结果后传入要渲染的模板，
     * 优先级：res.render 传入的对象> res.locals 对象 > app.locals 对象，
     * 所以 app.locals 和 res.locals 几乎没有区别，都用来渲染模板，
     * 使用上的区别在于：
     * app.locals 上通常挂载常量信息（如博客名、描述、作者信息），
     * res.locals 上通常挂载变量信息，即每次请求可能的值都不一样（如请求者信息，res.locals.user = req.session.user）。
     */

    //  express有4种方式来获取参数
    // 1. req.body
    // 2. req.query
    // 3. req.params
    // 4. req.param()

    // 其中req.body ，必须要在使用了body-parsing middleware中间件以后才有，
    // 比如 body-parser and multer.

    var id = req.query.id;

    // console.log(id, req.query, req.body);
    if (id > 0) {
        console.log(id)
    } else {
        throw new Error('Catch me');
    }
    var obj = {};
    obj.abd();

    var o = querystring.parse('foo=bar&abc=xyz&abc=123');
    console.log(typeof o);
    // 发送请求 request
    // request('http://google.com/doodle.png').pipe(fs.createWriteStream('doodle.png'))
    // request('http://freegeoip.net/json/github.com', function(error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //         console.log(body) //
    //     }
    // })
    const data = {
        title: 'app-title-res.render-data'
    }
    res.render("about", data)
});

router.get("/require", function(req, res) {
    res.write('hello');
    res.end();
});

router.get('/redis', function(req, res, next) {

    const client = redis.createClient('6379', '127.0.0.1');

    /*
    redis.createClient([options])
    redis.createClient(unix_socket[, options])
    redis.createClient(redis_url[, options])
    redis.createClient(port[, host][, options])
    */

    // redis 链接错误
    client.on("error", function(error) {
        console.log(error);
    });
    // redis 验证 (reids.conf未开启验证，此项可不需要)
    // client.auth("password");
    // client.set("cache-title", "redis cached title");
    // client.hset("hash key", "hashtest 1", "value 1", redis.print);
    // client.hset(["hash key", "hashtest 2", "value 2"], redis.print);
    // client.hset("hash key", "hashtest 3", "value 3", redis.print);
    // client.hkeys("hash key", function(err, replies) {
    //     console.log(replies.length + " replies:");
    //     replies.forEach(function(reply, i) {
    //         console.log("    " + i + ": " + reply);
    //     });
    //     client.quit();
    // });

    const ep = new Eventproxy();
    ep.fail(next);

    const renderData = {};
    ep.tail('cacheOne', 'cacheTwo', function(cacheOne, cacheTwo) {
        // 在所有指定的事件触发后，将会被调用执行
        // 参数对应各自的事件名的最新数据
        console.log(cacheOne, cacheTwo)
        renderData.cacheOne = cacheOne;
        renderData.cacheTwo = cacheTwo;
        res.send(renderData);
        client.incr("pv")
    });

    // 获取title
    client.get("title", function(err, ret) {
        console.log(ret)
            // const defaultVal = 'hello';
        let retVal;
        if (ret == null) { // 找不到缓存的时候去查询文件
            // retVal = defaultVal //  类似查询文件 又要回调 How?
            fs.readFile("t1.txt", 'utf-8', function(err, content) {
                retVal = content
                client.set("title", retVal);
                ep.emit('cacheOne', retVal);
            })

        } else {
            retVal = ret;
            ep.emit('cacheOne', retVal);
        }

    });

    // 获取subtitle
    client.get("subTitle", function(err, ret) {
        console.log(ret)
        const defaultVal = 'world';
        let retVal;
        if (ret == null) {
            retVal = defaultVal
            client.set("subTitle", retVal);
        } else {
            retVal = ret;
        }
        ep.emit('cacheTwo', retVal);
    });


})

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
    if (req.params.id === 0) next('route');
    // 负责将控制权交给栈中下一个中间件 // 分支2
    // 渲染常规页面  //  分支2 'a'|'b' == 'c'
    res.write("regular" + Date.now() + "\n" + new Date().getTime() + "\n" + process.uptime() + "\n");
    moment.locale('zh-cn')
    res.write(moment("20170430", "YYYYMMDD").fromNow())
    res.end()
});

// 处理渲染一个特殊页面 // 分支1
router.get('/user/:id', function(req, res) {
    console.log(req.params.id);
    res.send('special');
});

router.get('/fib', function(req, res) {
    // http 传来的东西默认都是没有类型的，都是 String，所以我们要手动转换类型
    let n = Number(req.query.n);
    n = parseInt(n, 10);

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
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root2',
        password: '2',
        database: 'nodejs'
    });

    console.log(Date.now);
    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }

        console.log('connected as id ' + connection.threadId);
    });

    // var ep = EventProxy.create('tpl', 'data', function (tpl, data) {
    //     // TODO
    // });
    // 等效于上面的
    // var ep = new EventProxy();
    // ep.all('tpl', 'data', function (tpl, data) {
    // // TODO
    // });

    const ep = new Eventproxy();
    ep.fail(next);

    ep.tail("queryAdmin", function(result) {
        res.jsonp(result)
    })

    // 查询
    connection.query('SELECT 1 + 1 AS solution', function(error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
    });


    connection.query('SELECT * FROM admin', function(error, results, fields) {
        if (error) throw error;
        ep.emit("queryAdmin", results);
    })
    connection.end();

    // res.send("mysql")
});


router.get('/fs', function(req, res, next) {
    // console.log(__dirname, process.cwd(),process.execPath);
    // /Users/zhoujian/Web/Nodejs/express/learn/routes
    // /Users/zhoujian/Web/Nodejs/express/learn
    // /usr/local/bin/node

    const appPath = process.cwd();
    const proxy = new Eventproxy();
    proxy.fail(next);

    const renderData = {};
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


    // res.render("fs");
});

router.get('/fs2', function(req, res, next) {

    const appPath = process.cwd();
    const ep = new Eventproxy();
    ep.fail(next);


    const renderData = {};
    renderData["data1"] = '1';
    renderData['data2'] = '2';


    ep.all('tpl', 'data', function(tpl, data) {
        // 在所有指定的事件触发后，将会被调用执行
        // 参数对应各自的事件名的最新数据
        console.log(data)
    });

    fs.readFile(appPath + '/t1.txt', 'utf-8', function(err, content) {
        ep.emit('tpl', content);
    });

    fs.readFile(appPath + '/t2.txt', 'utf-8', function(err, content) {
        ep.emit('data', content);
    });
    res.render("fs", renderData);
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