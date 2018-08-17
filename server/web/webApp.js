const express = require('express')
const cookieParser = require('cookie-parser');
const createError = require('http-errors')
const app = express()

const config = require('config')
const loginService = require('../service/loginService')

// json格式解析
app.use(express.json())
// x-www-form-urlencoded格式解析
app.use(express.urlencoded({ extended: false }))
// cookie解析
app.use(cookieParser())

//登录接口单独处理
app.post(config.loginAddress, function(req, res, next){
  // global.logger.info(`||--处理登录请求：${req.url}, 已耗时：${req.rsqStartTime}`)
  loginService.forwardToLogin(req, res, function(err){
    // global.logger.info(`||--结束处理登录请求：${req.url}, 已耗时：${req.rsqStartTime}`)
    if(err){
      next(err)
    }
  })
})


Object.keys(config.oauth).forEach(function (oauthKey) {
  const oauthValue = config.oauth[oauthKey];
  Object.keys(oauthValue).forEach(function (action) {
    const url = oauthValue[action]["url"];
    const originKey = oauthValue[action]["key"];
    app.all(url, function(req, res, next){
      const paramsKey = getParamsKey(oauthKey)
      loginService.forwardToOauthLogin(req, res, paramsKey, originKey, function(err){
        if(err){
          next(err)
        }
      })
    })
  });
});

function getParamsKey(oauthKey){
  if("weixin"===oauthKey){
    return "wxUnionid";
  }else if("sina"==oauthKey){
      return "sinaOpenid";
  }else if("qq"==oauthKey){
      return "qqOpenid";
  }else if("xiaomi"==oauthKey){
      return "xmOpenid";
  }
  return oauthKey
}






// 其他路径返回404
app.all('*', function(req, res, next){
  next(createError(404, 'url not found in http forward layer'))
})
// 错误处理
app.use(function (err, req, res, next) {
  const status = err.status || 500
  const message = err.message || 'error occurred in http forward layer'
  if(err.status === 500){
    global.logger.error('app error: \n' + err.stack)
  }
  res.status(status);
  res.end(message);
})

module.exports = app;