const express = require('express');

const router = express.Router();
const Eventproxy = require('eventproxy');
const redis = require('redis');
const fs = require("fs");

router.get('/', function(req, res, next) {
    /* 创建redis连接对象
        redis.createClient([options])
        redis.createClient(unix_socket[, options])
        redis.createClient(redis_url[, options])
        redis.createClient(port[, host][, options])
    */
    const client = redis.createClient({
        port: 6379,
        host: "127.0.0.1",
        retry_strategy: function(options) {
            if (options.error && options.error.code === 'ECONNREFUSED') {
                // End reconnecting on a specific error and flush all commands with a individual error
                console.log('连接被拒绝')
                return new Error('The server refused the connection');
            }
            // indicating how much time passed since the last time connected
            if (options.total_retry_time > 1000 * 60 * 60) {
                // End reconnecting after a specific timeout and flush all commands with a individual error
                return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
                // End reconnecting with built in error
                return undefined;
            }
            // reconnect after
            return Math.min(options.attempt * 100, 3000);
        }
    });

    console.log("hello");

    // redis 链接错误
    client.on("error", function(err) {
        console.log("Error " + err);
    });

    // client.auth('password', function(err) {
    //     if (err) throw err;
    // });

    client.on('connect', function() {
        console.log('Connected to Redis');
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

    client.get("title", function(err, ret) {
        if (err) {
            res.json(err);
        }
        console.log(err, ret);

        res.json({ title: ret });
    })
})

module.exports = router;