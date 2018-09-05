const url = require('url')
const httpProxy = require('http-proxy')
const consoleLogger = require('../../log-config').console

const config = require('config')
const util = require('../util')

// 全局缓存的对象，避免每次都重复parse
const urlConfig = {
  union: {
    url: config.forwardUrl,
    object: url.parse(config.forwardUrl)
  },
  old: {
    url: config.forwardUrlOld,
    object: url.parse(config.forwardUrlOld)
  },
  'new': {
    url: config.forwardUrlNew,
    object: url.parse(config.forwardUrlNew)
  }
}

//  连接后端代理的超时时间，超过这个时间将返回socket hang up的错误
const PROXY_TIMEOUT_MILLS = config.proxyTimeoutMills

//  新建代理
const mainProxy = httpProxy.createProxyServer()
//  配置监听，用来在request时对请求做修改
mainProxy.on('proxyReq', function (proxyReq, req, res) {
  // global.logger.info(`||--准备修改请求：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
  try{
    proxyReq.setHeader('host', urlConfig[req.rsqUrlType].object.host)
  }catch(err){
    consoleLogger.error(`--on proxyReq url: ${req.url}, \nerror: ${err.stack}`)
  }
});
//  配置监听，用来在response时对响应做修改
mainProxy.on('proxyRes', function(proxyRes, req, res){
  // global.logger.info(`||--准备修改相应：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
  try{
    if(proxyRes.headers['location']){
      proxyRes.headers['location'] = util.processRedirectLocation(proxyRes.headers['location'],  req.rsqUrlType === 'new')
    }
    //  记录慢请求的时间
    util.logSlowRequest(req, proxyRes)
  }catch(err){
    consoleLogger.error(`--on proxyRes url: ${req.url}, \nerror: ${err.stack}`)
  }
})
mainProxy.on('error', function(err, req, res){
  consoleLogger.error(`--proxy url: ${req.url}, \nerror: ${err.stack}`)
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end('Something went wrong.');
})

//  proxy主方法，用来走代理
const proxy = function(req, res){
  try{
    // global.logger.info(`||--准备验证isOld：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
    const rsqUrlType = util.isOld(req) ? 'old': 'new'
    // 在req中添加new或者old，以便后续调用
    req.rsqUrlType = rsqUrlType
    // 判断是走新接口还是旧接口
    global.logger.warn(`--${urlConfig.union.url}${req.url} 被代理到 ${urlConfig[rsqUrlType].url}`)
    // global.logger.info(`||--准备代理mainProxy.web(...)：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
    if(req.url.indexOf("/task/v1/team/invite/joinOut")!=-1 && "old"==rsqUrlType){
        req.url = "/task/v2/invite/inviteJoinTeam"
    }
    mainProxy.web(req, res, {
      target: urlConfig[rsqUrlType].url,
      secure: false,
      followAllRedirects: true,
      proxyTimeout: PROXY_TIMEOUT_MILLS
    });
  }catch(err){
    consoleLogger.error(`==proxy error: url: ${req.url}, \nerror: ${err.stack}`)
  }
}

module.exports = proxy