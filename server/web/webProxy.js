const url = require('url')
const httpProxy = require('http-proxy')

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

//  新建代理
const mainProxy = httpProxy.createProxyServer()
//  配置监听，用来在request时对请求做修改
mainProxy.on('proxyReq', function (proxyReq, req, res) {
  global.logger.info(`||--准备修改请求：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
  proxyReq.setHeader('host', urlConfig[req.rsqUrlType].object.host)
});
//  配置监听，用来在response时对响应做修改
mainProxy.on('proxyRes', function(proxyRes, req, res){
  global.logger.info(`||--准备修改相应：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
  if(proxyRes.headers['location']){
    proxyRes.headers['location'] = util.processRedirectLocation(proxyRes.headers['location'],  req.rsqUrlType === 'new')
  }
})

//  proxy主方法，用来走代理
const proxy = function(req, res){
  try{
    global.logger.info(`||--准备验证isOld：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
    const rsqUrlType = util.isOld(req) ? 'old': 'new'
    // 在req中添加new或者old，以便后续调用
    req.rsqUrlType = rsqUrlType
    // 判断是走新接口还是旧接口
    global.logger.info(`--${urlConfig.union.url}${req.url} 被代理到 ${urlConfig[rsqUrlType].url}`)
    global.logger.info(`||--准备代理mainProxy.web(...)：${req.url}, 已耗时：${new Date().getTime() - req.rsqStartTime}ms`)
    mainProxy.web(req, res, {
      target: urlConfig[rsqUrlType].url,
      secure: false,
      followAllRedirects: true
    });
  }catch(err){
    global.logger.error(`proxy error: url: ${req.url}, \nerror: ${err.stack}`)
  }
}

module.exports = proxy