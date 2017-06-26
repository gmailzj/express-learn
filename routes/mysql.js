const express = require('express');
const mysql = require('mysql');
const Eventproxy = require('eventproxy');

const router = express.Router();

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

module.exports = router;