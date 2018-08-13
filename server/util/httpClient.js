var request = require('request')

var config = require('config')
var log = require('../../log-config')
var util = require('./index')

// 测试新版用户是否存在
function isExistNew(username, callback){
  var url = config.forwardUrlNew + "/task/v1/register/isRegistered";
  if(util.isPhone(username)){
    url += "?phoneNumber="
  }else{
    url += "?email="
  }
  url += username;
  // 测试是否新版用户存在
  request({ uri: url, json: true }, function(err, resp, json){
    log.info("是否新版用户存在："+json["isAccountExist"]);
    return callback(err, json["isAccountExist"])
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
  log.info("地址："+config.forwardUrl+req.url+"被代理到："+loginUrl);

  const formData = {}
  for(let key in json){
    formData[key] = json[key]
  }

  request({
    method: req.method,
    uri: loginUrl,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    formData: formData,
    followRedirect: false
  }, function(err, resp, body){
    callback(err, resp, body)
  })
}

module.exports.isExistNew = isExistNew
module.exports.toLogin = toLogin