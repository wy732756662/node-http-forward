var config = require('config')
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
  if(req.url.indexOf("/task/rsqAttach/userAvatar") !== -1 &&
      req.url.indexOf(config.newTokenPrefix) !== -1
  ){
      return false;
  }
  if(req.url.indexOf("/task/v2/register") !== -1
  ){
    return true;
  }
  if(req.url.indexOf("/task/v1/register")!==-1 ||
      req.url.indexOf("/task/v1/team/invite/verifyCode")!==-1 ||
      req.url.indexOf("/task/login/success") !== -1 ||
      req.url.indexOf("/task/v1/sina/loginPage") !== -1 ||
      req.url.indexOf("/task/v1/weixin/loginPage") !== -1 ||
      req.url.indexOf("/task/v1/qq/loginPage") !== -1 ||
      req.url.indexOf("/task/sinaOauth/afterLogin") !== -1 ||
      req.url.indexOf("/task/weixinOauth/afterLogin") !== -1 ||
      req.url.indexOf("/task/qqOauth/afterLogin") !== -1 ||
      req.url.indexOf("/task/v1/findBackPassword") !== -1
  ){
      return false;
  }
  var headers = req.headers;
  var token = headers["token"];
  if(token && token.indexOf(config.newTokenPrefix) !== -1){
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

// 获取第三方登录前验证新旧版接口的参数
function getParamsKey(oauthKey){
    if("weiXin"===oauthKey){
        return "wxUnionid";
    }else if("sina"==oauthKey){
        return "sinaOpenid";
    }else if("qq"==oauthKey){
        return "qqOpenid";
    }else if("xiaoMi"==oauthKey){
        return "xmOpenid";
    }
    return oauthKey
}

module.exports.isPhone = isPhone
module.exports.isOld = isOld
module.exports.getParamsKey = getParamsKey
module.exports.processRedirectLocation = processRedirectLocation