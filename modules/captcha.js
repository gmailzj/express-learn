var captchapng = require('captchapng');

exports.captchap = function(req, res, next) {
    var width = !isNaN(parseInt(req.query.width)) ? parseInt(req.query.width) : 100;
    var height = !isNaN(parseInt(req.query.height)) ? parseInt(req.query.height) : 30;

    var code = parseInt(Math.random() * 9000 + 1000);
    req.session.checkcode = code;

    var p = new captchapng(width, height, code);
    p.color(0xff, 0xff, 0xff, 255); // First color: background (red, green, blue, alpha)
    p.color(0x1a, 0xa2, 0x60, 255); // Second color: paint (red, green, blue, alpha)
    p.color(0x33, 0x66, 0x99, 255); // Second color: paint (red, green, blue, alpha)

    var img = p.getBase64();
    var imgbase64 = new Buffer(img, 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    res.end(imgbase64);
}