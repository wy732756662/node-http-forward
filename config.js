var config = {
    // server端口号
    PORT: 8081,
    // 当前的url
    forwardUrl: "http://127.0.0.1:8081",
    // 要转发到新版的url
    // var forwardUrlNew = "https://betanew.rishiqing.com";
    forwardUrlNew: "https://betanew.rishiqing.com",
    // 要转发到新版的url
    forwardUrlOld: "https://betaold.rishiqing.com",
    // var forwardUrlNew = "https://betanew.rishiqing.com";
    forwardUrlNewReg: new RegExp("^http[s]?:\\/\\/betanew\\.rishiqing\\.com"),
    // 要转发到新版的url
    forwardUrlOldReg: new RegExp("^http[s]?:\\/\\/betaold\\.rishiqing\\.com"),
    // 登录地址
    loginAddress: "/task/j_spring_security_check",
};
exports = module.exports = config;