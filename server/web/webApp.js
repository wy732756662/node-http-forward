const express = require('express')
const cookieParser = require('cookie-parser');
const createError = require('http-errors')
const app = express()

const config = require('config')
const loginService = require('../service/loginService')
const consoleLogger = require('../../log-config').console
const util = require('../util')

// json格式解析
app.use(express.json())
// x-www-form-urlencoded格式解析
app.use(express.urlencoded({ extended: false }))
// cookie解析
app.use(cookieParser())

//登录接口单独处理
app.post(config.loginAddress, function(req, res, next){
  // global.logger.info(`||--处理登录请求：${req.url}, 已耗时：${req.rsqStartTime}`)
  try {
    loginService.forwardToLogin(req, res, function(err){
      //  记录慢请求的时间
      util.logSlowRequest(req)
      if(err){
        next(err)
      }
    })
  } catch (err) {
    next(err)
  }
})


Object.keys(config.oauth).forEach(function (oauthKey) {
  const oauthValue = config.oauth[oauthKey];
  Object.keys(oauthValue).forEach(function (action) {
    const url = oauthValue[action]["url"];
    const originKey = oauthValue[action]["key"];
    app.all(url, function(req, res, next){
      try {
        loginService.forwardToOauthLogin(req, res, oauthKey, originKey, function(err){
          //  记录慢请求的时间
          util.logSlowRequest(req)
          if(err){
              next(err)
          }
        })
      } catch (err) {
          next(err)
      }
    })
  });
});


// 其他路径返回404
app.all('*', function(req, res, next){
  next(createError(404, 'url not found in http forward layer'))
})
// 错误处理
app.use(function (err, req, res, next) {
  const status = err.status || 500
  const message = 'error occurred'
  if(status >= 400){
    consoleLogger.error(`app url ${status}: ${req.url}, error: \n ${err.stack}`)
  }
  res.status(status);
  res.end(message);
})

module.exports = app;