const express = require('express');
// const fs = require("fs");
// const path = require('path');
const moment = require('moment');
const superagent = require('superagent');
const cheerio = require('cheerio');
const Eventproxy = require('eventproxy');
const async = require("async");
const url = require('url');
const main = require('../main');

const router = express.Router();
const cnodeUrl = 'https://cnodejs.org/';

router.use(function(req, res, next) {
        console.log(__filename)
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        next();
    })
    /* GET users listing. */
router.get('/', function(req, res, next) {
    // 使用res.write 以后不能再使用  res.send 和 res.render, 但是最终要使用res.end
    // res.write('respond with a resource');
    // res.write('respond with a resource');

    // 添加到header头
    // res.append('Warning', '199 Miscellaneous warning');

    // 用res.send 以后不能再用res.end('内容') ,Can't set headers after they are sent.
    // res.send({ user: 'tobi' });
    // res.send('send');

    /*
    The body parameter can be a Buffer object, a String, an object, or an Array. For example:
    res.send(new Buffer('whoop'));
    res.send({ some: 'json' });
    res.send('<p>some html</p>');
    res.status(404).send('Sorry, we cannot find that!');
    res.status(500).send({ error: 'something blew up' });
    */

    res.end("users-index");
    // res.end();
    // res.render("fs")
});

router.get('/list', function(req, res, next) {
    // 用 superagent 去抓取 https://cnodejs.org/ 的内容
    superagent.get('https://cnodejs.org/')
        .end(function(err, sres) {
            // 常规的错误处理
            if (err) {
                return next(err);
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            let $ = cheerio.load(sres.text);
            let items = [];
            let topicUrls = [];
            $('#topic_list .topic_title').each(function(idx, element) {
                let $element = $(element);
                items.push({
                    title: $element.attr('title'),
                    href: $element.attr('href')
                });
                let href = url.resolve(cnodeUrl, $element.attr('href'));
                topicUrls.push(href);
            });

            // 得到 topicUrls 之后

            // 得到一个 eventproxy 的实例
            const ep = new Eventproxy();

            // 命令 ep 重复监听 topicUrls.length 次（在这里也就是 40 次） `topic_html` 事件再行动
            ep.after('topic_html', topicUrls.length, function(topics) {
                // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

                // 绑定打开详情页事件
                let topicsRet = topics.map(function(topicPair) {
                    // 接下来都是 jquery 的用法了
                    let topicUrl = topicPair[0];
                    let topicHtml = topicPair[1];
                    let $ = cheerio.load(topicHtml);
                    return ({
                        title: $('.topic_full_title').text().trim(),
                        href: topicUrl,
                        comment1: $('.reply_content').eq(0).text().trim(),
                    });
                });

                console.log('final:');
                console.log(topicsRet);
            });

            // 打开详情页
            topicUrls.forEach(function(topicUrl) {
                superagent.get(topicUrl)
                    .end(function(err, res) {
                        console.log('fetch ' + topicUrl + ' successful');
                        ep.emit('topic_html', [topicUrl, res.text]);
                    });
            });

            res.send(items);
        });
});

// 一个中间件栈，显示任何指向 /user/:id 的 HTTP 请求的信息
router.use(/\d+/, function(req, res, next) {
    console.log('Request URL:', req.originalUrl);
    next();
}, function(req, res, next) {
    console.log('Request Type:', req.method);
    next();
});

// 一个中间件栈，处理指向 的 GET 请求
router.get(/(\d+)/, function(req, res, next) {
    // 如果 user id 为 0, 跳到下一个路由   // 分支1
    console.log(req.params);
    // 如果是正则，需要用到分组
    let id = parseInt(req.params["0"], 10);
    if (id === 0) next('route');
    // 负责将控制权交给栈中下一个中间件 // 分支2
    // 渲染常规页面  //  分支2 'a'|'b' == 'c'
    res.write("regular" + Date.now() + "\n" + new Date().getTime() + "\n" + process.uptime() + "\n");
    moment.locale('zh-cn')
    res.write(moment("20170730", "YYYYMMDD").fromNow())
    res.end()
});

// 处理渲染一个特殊页面 // 分支1
router.get(/\d+/, function(req, res) {
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
router.get('/async', function(req, res, next) {
    // 用 superagent 去抓取 https://cnodejs.org/ 的内容
    superagent.get('https://cnodejs.org/')
        .end(function(err, sres) {
            // 常规的错误处理
            if (err) {
                return next(err);
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            var $ = cheerio.load(sres.text);
            var items = [];
            var topicUrls = [];
            $('#topic_list .topic_title').each(function(idx, element) {
                var $element = $(element);
                items.push({
                    title: $element.attr('title'),
                    href: $element.attr('href')
                });
                var href = url.resolve(cnodeUrl, $element.attr('href'));
                topicUrls.push(href);
            });

            // 得到 topicUrls 之后

            // 并发连接数的计数器
            var concurrencyCount = 0;
            var fetchUrl = function(url, callback) {
                // delay 的值在 2000 以内，是个随机的整数
                var delay = parseInt((Math.random() * 10000000) % 2000, 10);
                concurrencyCount++;
                console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');

                superagent.get(url)
                    .end(function(err, res) {
                        concurrencyCount--;
                        callback(null, [url, res.text]);
                    });
            };

            async.mapLimit(topicUrls, 5, function(url, callback) {
                fetchUrl(url, callback);
            }, function(err, topics) {

                topics = topics.map(function(topicPair) {
                    // 接下来都是 jquery 的用法了
                    var topicUrl = topicPair[0];
                    var topicHtml = topicPair[1];
                    var $ = cheerio.load(topicHtml);
                    return ({
                        title: $('.topic_full_title').text().trim(),
                        href: topicUrl,
                        comment1: $('.reply_content').eq(0).text().trim(),
                    });
                });

                console.log('final:');
                // console.log(topics);
                res.send(topics);
            });

            // res.write('abc');
            // res.end();
        });

});


module.exports = router;