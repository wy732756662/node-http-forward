var request = require('request')

var config = require('config')
var log = require('../../log-config').default
var util = require('./index')

//  设置5s的超时时间
const TIMEOUT_MILLS = 5 * 1000

// 测试新版用户是否存在
function isExistNew(username, callback){
  try{
    var url = config.forwardUrlNew + "/task/v1/register/isRegistered";
    if(util.isPhone(username)){
      url += "?phoneNumber="
    }else{
      url += "?email="
    }
    url += username;
  }catch (err){
    return callback(err)
  }
  // 测试是否新版用户存在
  request({ uri: url, json: true, timeout: TIMEOUT_MILLS }, function(err, resp, json){
    try{
      if(err){
        return callback(err)
      }
      if(resp.statusCode >= 400){
        return callback(new Error(`isExistNew: ${resp.statusCode}`))
      }
      // log.info("是否新版用户存在："+json["isAccountExist"]);
      if(json){
        return callback(err, json["isAccountExist"])
      }else{
        return callback(new Error('----isExistNew response body empty'))
      }
    }catch(err){
      return callback(err)
    }
  });
}

// 测试新版第三方用户是否存在
function isExistNewOauth(key,value,callback){
  try{
    var url = config.forwardUrlNew + `${config.verifyOauthExistUrl}?${key}=${value}`;
  }catch(err){
    return callback(err)
  }
    // 测试是否新版用户存在
  request({ uri: url, json: true, timeout: TIMEOUT_MILLS }, function(err, resp, json){
    try{
      if(err){
        return callback(err)
      }
      if(resp.statusCode >= 400){
        return callback(new Error(`isExistNewOauth: ${resp.statusCode}`))
      }
      // log.info("是否新版第三方用户存在："+json["isAccountExist"]);
      if(json){
        return callback(err, json["isAccountExist"])
      }else{
        return callback(new Error('----isExistNewOauth response body empty'))
      }
    }catch (err){
      return callback(err)
    }
  });
}

/**
 * 登录请求，请求不会跟踪重定向，将所有返回的数据返还到的请求上
 * @param req
 * @param loginUrl
 * @param json
 * @param callback
 * @returns {*}
 */
function toLogin(req, loginUrl, json, callback){
  log.warn("地址："+config.forwardUrl+req.url+"被代理到："+loginUrl);

  try{
    var body = ''
    for(var key in json){
      if(body!=''){
        body += '&'
      }
      body += (key+"="+json[key])
    }
  }catch (err){
    return callback(err)
  }

  request({
    method: req.method,
    uri: loginUrl,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: body,
    followRedirect: false,
    timeout: TIMEOUT_MILLS
  }, function(err, resp, body){
    try{
      if(err){
        return callback(err)
      }
      if(resp.statusCode >= 400){
        return callback(new Error(`toLogin: ${resp.statusCode}`))
      }
      return callback(err, resp, body)
    }catch (err){
      return callback(err)
    }
  })
}
/**
 * 登录请求，请求不会跟踪重定向，将所有返回的数据返还到的请求上
 * @param req
 * @param loginUrl
 * @param json
 * @param callback
 * @returns {*}
 */
function toOauthLogin(req, loginUrl, json, callback){
  log.warn("地址："+config.forwardUrl+req.url+"被代理到："+loginUrl);

  request({
    method: req.method,
    uri: loginUrl,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/json, text/javascript, */*; q=0.01"
    },
    json: json,
    followRedirect: false,
    timeout: TIMEOUT_MILLS
  }, function(err, resp, body){
    try{
      if(err){
        return callback(err)
      }
      if(resp.statusCode >= 400){
        return callback(new Error(`toOauthLogin: ${resp.statusCode}`))
      }
      return callback(err, resp, body)
    }catch (err){
      return callback(err)
    }
  })
}

module.exports.isExistNew = isExistNew
module.exports.isExistNewOauth = isExistNewOauth
module.exports.toLogin = toLogin
module.exports.toOauthLogin = toOauthLogin