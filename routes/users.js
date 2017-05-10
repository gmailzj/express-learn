var express = require('express');
var router = express.Router();
var fs = require("fs");
const path = require('path');
var moment = require('moment');


var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var async = require("async");

var url = require('url');

router.use(function(req, res, next){
	console.log(__filename)
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	next();
})
/* GET users listing. */
router.get('/', function(req, res, next) {
    // 使用res.write 以后不能再使用  res.send 和 res.render, 但是最终要使用res.end
    //res.write('respond with a resource');
    //res.write('respond with a resource');
    
    // 添加到header头
    //res.append('Warning', '199 Miscellaneous warning');

    // 用res.send 以后不能再用res.end('内容') ,Can't set headers after they are sent.
    //res.send({ user: 'tobi' });
    //res.send('send');
    
    /*
    The body parameter can be a Buffer object, a String, an object, or an Array. For example:
    res.send(new Buffer('whoop'));
    res.send({ some: 'json' });
    res.send('<p>some html</p>');
    res.status(404).send('Sorry, we cannot find that!');
    res.status(500).send({ error: 'something blew up' });
    */
   
    res.end("\n end")
    //res.end();
    //res.render("fs")
});

var cnodeUrl = 'https://cnodejs.org/';

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

            // 得到一个 eventproxy 的实例
            var ep = new eventproxy();

            // 命令 ep 重复监听 topicUrls.length 次（在这里也就是 40 次） `topic_html` 事件再行动
            ep.after('topic_html', topicUrls.length, function(topics) {
                // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

                // 开始行动
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
                console.log(topics);
            });

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
                //console.log(topics);
                //res.wrete(topics);
            });

            

            res.write('abc');
            res.end();
        });

});


module.exports = router;
