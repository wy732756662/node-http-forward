var config = require('config')
var log = require('../../log-config')
// 验证是否是手机号
function isPhone(username) {
  var myreg = /^[1][0-9]{10}$/;
  return myreg.test(username);
}

function processRedirectLocation(location,isNew){
  if(!location){
    return null
  }
  if(isNew){
    return location.replace(new RegExp(config.forwardUrlNewReg),config.forwardUrl);
  }else{
    return location.replace(new RegExp(config.forwardUrlOldReg),config.forwardUrl);
  }
}

// 通过请求的headers来判断当前请求是应该去新版还是旧版
function isOld(req) {
  if(req.url.indexOf("/task/v2/register") !== -1){
    return true;
  }
  if(req.url.indexOf("/task/v1/register")!=-1 ||
      req.url.indexOf("/task/v1/team/invite/verifyCode")!=-1){
      return false;
  }
  var headers = req.headers;
  var token = headers["token"];
  if(token && token.indexOf("new_") !== -1){
    return false;
  }
  var version = headers["version"];
  if("latest" === version){
    return false;
  }else if("old" === version){
    return true;
  }
  var isBackNewVersion = headers["isBackNewVersion"];
  if (isBackNewVersion) {
    return isBackNewVersion === "false";
  }
  var cookies = headers["cookie"]
  if (!cookies) {
    return true
  }
  var isOld = true;
  cookies.split(";").forEach(function (cookie) {
    if(cookie.indexOf("version=latest") !== -1){
      isOld = false;
      return false;
    }
  });
  return isOld;
}

module.exports.isPhone = isPhone
module.exports.isOld = isOld
module.exports.processRedirectLocation = processRedirectLocation