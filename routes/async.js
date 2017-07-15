const express = require('express');
const superagent = require('superagent');
const cheerio = require('cheerio');
const async = require("async");
const url = require('url');

const router = express.Router();
const cnodeUrl = 'https://cnodejs.org/';

router.get('/', function(req, res, next) {
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

            // 并发连接数的计数器
            let concurrencyCount = 0;
            const fetchUrl = function(url, callback) {
                // delay 的值在 2000 以内，是个随机的整数
                let delay = parseInt((Math.random() * 10000000) % 2000, 10);
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
                let topicsFmt = topics.map(function(topicPair) {
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
                // console.log(topics);
                res.send(topicsFmt);
            });

            // res.write('abc');
            // res.end();
        });
});

module.exports = router;