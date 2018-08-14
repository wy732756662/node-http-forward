# node-http-forward

任何访问服务器的接口都先访问到此node服务器，通过此服务器进行接口转发（新版和旧版）

node.version > 8.0


{
  "PORT": 8081,  //  server端口号
  "forwardUrl": "http://localhost:8081",  //  当前的url
  "forwardUrlNew": "https://betanew.rishiqing.com",  //  要转发到新版的url
  "forwardUrlOld": "https://betaold.rishiqing.com",  //  要转发到旧版的url
  "forwardUrlNewReg": "^http[s]?:\\/\\/betanew\\.rishiqing\\.com",  //  新版的正则表达式
  "forwardUrlOldReg": "^http[s]?:\\/\\/betaold\\.rishiqing\\.com",  //  旧版的正则表达式
  "loginAddress": "/task/j_spring_security_check"  //  登录地址，登录地址进行特殊处理
}

# 启动
`npm start`
或者
`node server/index.js`

  
