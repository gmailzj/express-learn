var http = require('http');

// process.on('uncaughtException', function(err) {
//     //打印出错误
//     console.log(err);
//     //打印出错误的调用栈方便调试
//     console.log(err.stack);
// });

// 方式1
// var server = http.createServer(function(req, res) {

//     //这里有个错误，params 是 undefined
//     var ok = req.params.ok;
//     res.writeHead(200, { 'Content-Type': 'text/plain' });
//     res.end('Hello World\n');
// });
// server.listen(8080, '127.0.0.1');


// 方式2
http.createServer(function(req, res) {
    try {
        handler(req, res);
    } catch (e) {
        console.log('\r\n', e, '\r\n', e.stack);
        try {
            res.end(e.stack);
        } catch (e) {}
    }
}).listen(8080, '127.0.0.1');

var handler = function(req, res) {
    //Error Popuped
    var name = req.params.name;

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello ' + name);
};

console.log('Server running at http://127.0.0.1:8080/');