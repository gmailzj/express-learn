var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session && req.session.sign) { //检查用户是否已经登录
        console.log(req.session); //打印session的值
    } else {
    	//验证权限
        req.session.sign = true;
        req.session.name = 'session-name'
    }
    res.render('index', { title: 'Express' });
});

module.exports = router;
