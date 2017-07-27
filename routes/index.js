const express = require('express');

const router = express.Router();
const fs = require("fs");
// const path = require('path');
const Eventproxy = require('eventproxy');
const debug = require('debug')('learn:*');
const querystring = require('querystring');
const ipip = require("../modules/ip");
const maxmind = require('maxmind');

ipip.load("/Users/zhoujian/Downloads/17monipdb/17monipdb.dat");
// const request = require('request');

// const config = require('config');

const appPath = global.app_path;

// // 读取公共数据  1种是用户配置文件  2种全局变量
// const dbConfig = config.get('Customer.dbConfig');
// const utils = require(path.resolve(appPath, "./modules/utils"));
// console.log(path.resolve(appPath, "./modules/utils"));
const common = require(appPath + "/modules/common");

common.config = {};
// console.log(common);

router.get("/ip2/:ip", function(req, res) {
    let ip = req.params.ip || "14.215.177.37";
    res.send(ipip.findSync(ip))
})

router.get("/ip/:ip", function(req, res) {
    let ip = req.params.ip;
    maxmind.open('/Users/zhoujian/Downloads/db', (err, cityLookup) => {
        // var city = cityLookup.get('121.35.101.34');
        let city = cityLookup.get(ip);
        console.log(city);
        res.json(city);
    });
})

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
router.get("/captcha", require("../modules/captcha").captchap);

router.get("/200", function(req, res) {
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

    let id = req.query.id;

    // console.log(id, req.query, req.body);
    if (id > 0) {
        // console.log(id)
    } else {
        throw new Error('Catch me');
    }
    let obj = {};
    obj.abd();

    let o = querystring.parse('foo=bar&abc=xyz&abc=123');
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


router.get("/fs1", function(req, res, next) {
    fs.readFile('input.txt', function(err, data) {
        if (err) {
            res.end(err.stack);
            return;
        }
        res.end(data.toString());
    });
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
    fs.readFile(appPath + '/t3.txt', 'utf8', proxy.done('r2', function(data2) {
        console.log(Date.now())
        return data2;
    }));
    proxy.all('r1', 'r2', function(data1, data2) {
        console.log(data1, data2)
        renderData.data1 = data1;
        renderData.data2 = data2;
        res.render('fs', renderData);
    })


    // res.render("fs");
});

router.get('/fs2', function(req, res, next) {

    const appPath = process.cwd();
    const ep = new Eventproxy();
    ep.fail(next);


    const renderData = {};
    renderData.data1 = '1';
    renderData.data2 = '2';


    ep.all('tpl', 'data', function(tpl, data) {
        // 在所有指定的事件触发后，将会被调用执行
        // 参数对应各自的事件名的最新数据
        console.log(data)
        res.render("fs", renderData);
    });

    fs.readFile(appPath + '/t1.txt', 'utf-8', function(err, content) {
        ep.emit('tpl', content);
    });

    fs.readFile(appPath + '/t2.txt', 'utf-8', function(err, content) {
        ep.emit('data', content);
    });
    // res.render("fs", renderData);
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