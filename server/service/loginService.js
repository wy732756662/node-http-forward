const httpClient = require('../util/httpClient')
const config = require('config')
const util = require('../util')

function forwardToLogin(req, res, callback){
  // 将参数转换成Json
  var json = req.body
  // 通过用户名去新版判断用户应该在新版登录还是旧版
  httpClient.isExistNew(json["j_username"], function(err, isNew){
    global.logger.info(`||--httpClient.isExistNew：${req.url}, 已耗时：${req.rsqStartTime}`)
    if(err){
      return callback(err)
    }
    global.logger.info(`>>--是否是新版用户：${isNew}`)

    // 需要处理到coolie里面的数据
    var version = isNew?"latest":"old";
    // 请求登录的域名
    var urlPrefix = isNew?config.forwardUrlNew:config.forwardUrlOld;

    // 发送登录请求
    httpClient.toLogin(req, urlPrefix+req.url, json, function(err, loginRes, body){
      global.logger.info(`||--httpClient.toLogin：${req.url}, 已耗时：${req.rsqStartTime}`)
      if(err){
        return callback(err)
      }
      // 访问服务器返回页面则直接返回
      if(loginRes.statusCode==502){
        res.status(500);
        res.end();

        callback()
        return
      }

      try {
        // 将登录请求返回的response里的headers拿出来处理一下
        var resHeaders = loginRes.headers;
        // 将cookie放到返回的headers里
        var setCookie = resHeaders["set-cookie"];
        if(!setCookie){
          setCookie = ['version='+version+'; Path=/; HttpOnly'];
        }else{
          setCookie.push('version='+version+'; Path=/; HttpOnly');
        }
        resHeaders["set-cookie"] = setCookie;
        // 登录请求返回的重定向地址
        // 将重定向地址过滤域名后放到返回的headers里让请求重定向
        resHeaders['location'] = util.processRedirectLocation(resHeaders['location'],isNew);
        // 将headers放到response里
        res.status(loginRes.statusCode);
        res.set(resHeaders);
        res.end();

        callback()
      }catch(err){
        callback(err)
      }
    })
  })
}

module.exports = forwardToLogin