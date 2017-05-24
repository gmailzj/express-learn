// 定义导出模块 
exports = module.exports = utils;


function utils() {
    var obj = { a: 1 }
    return obj;
}

// 相当于 在上面定义的函数上添加属性
exports.title = 'abc'