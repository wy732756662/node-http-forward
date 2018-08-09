var url = require('url')
    , http = require('http')
    , https = require('https')
    , request = require('sync-request')
    , querystring = require('querystring')
    , config = require('./config');

// 创建监听server
var server = http.createServer(function(req, res) {
    if(config.loginAddress == req.url){
        //登录接口单独处理
        forwardToLogin(req, res)
    }else{
        req.pause();
        // 转发
        var connector;
        // 如果请求头或者cookie里有新版的字段，则访问新版，有旧版字段返回旧版
        if(isOld(req)){
            connector = forwardToUrl(req,res,config.forwardUrlOld+req.url,true);
        }else{
            connector = forwardToUrl(req,res,config.forwardUrlNew+req.url,false);
        }

        req.pipe(connector, {end:true});
        req.resume();
    }
});
// 登录接口转发
function forwardToLogin(req,res){
    // 请求body里面的参数
    var str = '';
    // 每次request返回部分数据时拼接到str里
    req.on('data', function (data) {
        str += data
    });

    // 数据全部到达触发
    req.on('end', function () {
        // 将参数转换成Json
        var json = querystring.parse(str)
        // 通过用户名去新版判断用户应该在新版登录还是旧版
        var isNew = isExistNew(json["j_username"]);
        // 需要处理到coolie里面的数据
        var version = isNew?"latest":"old";
        // 请求登录的域名
        var urlPrefix = isNew?config.forwardUrlNew:config.forwardUrlOld;
        // 发送登录请求
        var loginRes = toLogin(req,urlPrefix+req.url,json);
        // 将登录请求返回的response里的headers拿出来处理一下
        var resHeaders = loginRes.headers;
        // 将cookie放到返回的headers里
        var setCookie = resHeaders["set-cookie"];
        if(setCookie==undefined){
            setCookie = ['version='+version+'; Path=/; HttpOnly'];
        }else{
            setCookie.push('version='+version+'; Path=/; HttpOnly');
        }
        resHeaders["set-cookie"] = setCookie;
        // 登录请求返回的重定向地址
        // 将重定向地址过滤域名后放到返回的headers里让请求重定向
        resHeaders['location'] = processRedirectLocation(resHeaders['location'],isNew);
        // 将headers放到response里
        res.writeHeader(loginRes.statusCode, resHeaders);
        res.end();
    });
}
// 将某一个接口（除了登录）转发到另外一个接口
function forwardToUrl(req,res,forwardReqUrl,isOld){
    console.log("地址："+config.forwardUrl+req.url+"被代理到："+forwardReqUrl);
    var options = url.parse(forwardReqUrl);
    options.headers = req.headers;
    options.method = req.method;
    options.agent = false;
    options.headers['host'] = options.host;

    var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
        // console.log('<== Received res for', serverResponse.statusCode, reqUrl);
        // console.log('\t-> Request Headers: ', options);
        // console.log(' ');
        // console.log('Response Headers: ', serverResponse.headers);

        serverResponse.pause();

        serverResponse.headers['access-control-allow-origin'] = '*';

        switch (serverResponse.statusCode) {
            // pass through.  we're not too smart here...
            case 200: case 201: case 202: case 203: case 204: case 205: case 206:
            case 304:
            case 400: case 401: case 402: case 403: case 404: case 405:
            case 406: case 407: case 408: case 409: case 410: case 411:
            case 412: case 413: case 414: case 415: case 416: case 417: case 418:
            res.writeHeader(serverResponse.statusCode, serverResponse.headers);
            serverResponse.pipe(res, {end:true});
            serverResponse.resume();
            break;

            // fix host and pass through.
            case 301:
            case 302:
            case 303:
                serverResponse.statusCode = 303;
                var headers = serverResponse.headers;
                headers['location'] = processRedirectLocation(headers['location'],!isOld);

                // console.log('\t-> Redirecting to ', serverResponse.headers['location']);
                res.writeHeader(serverResponse.statusCode, headers);
                serverResponse.pipe(res, {end:true});
                serverResponse.resume();
                break;

            // error everything else
            default:
                // var stringifiedHeaders = JSON.stringify(serverResponse.headers, null, 4);
                // serverResponse.resume();
                // res.writeHeader(500, {
                //     'content-type': 'text/plain'
                // });
                // res.end(process.argv.join(' ') + ':\n\nError ' + serverResponse.statusCode + '\n' + stringifiedHeaders);
                res.writeHeader(serverResponse.statusCode, serverResponse.headers);
                serverResponse.pipe(res, {end:true});
                serverResponse.resume();
                break;
        }
    });
    return connector;
}
// 通过请求的headers来判断当前请求是应该去新版还是旧版
function isOld(req) {
    if(req.url.indexOf("/task/v2/register")!=-1){
        return true;
    }
    var headers = req.headers;
    var version = headers["version"];
    if (version!=undefined) {
        return version!="latest";
    }
    var isBackNewVersion = headers["isBackNewVersion"];
    if (isBackNewVersion!=undefined) {
        return isBackNewVersion==false || isBackNewVersion=="false";
    }
    var cookies = headers["cookie"]
    if (cookies==null || cookies==undefined) {
        return false
    }
    var isOld = true;
    cookies.split(";").forEach(function (cookie) {
        if(cookie.indexOf("version=latest")!=-1){
            isOld = false;
            return false;
        }
    });
    return isOld;
}
// 测试新版用户是否存在
function isExistNew(username){
    var url = config.forwardUrlNew+"/task/v1/register/isRegistered";
    if(isPhone(username)){
        url += "?phoneNumber="
    }else{
        url += "?email="
    }
    url += username;
    // 测试是否新版用户存在
    var res = request('GET', url);
    // 返回值
    var resStr = res.body.toString('utf-8')
    var json = JSON.parse(resStr);

    console.log("是否新版用户存在："+json["isAccountExist"]);
    return json["isAccountExist"]
}
/*
    登录请求，请求不会跟踪重定向，将所有返回的数据返还到的请求上
    该请求为同步请求，因为需要将返回数据连接到之前请求上，
    使用异步请求做不到
 */
function toLogin(req,loginUrl,json){
    console.log("地址："+config.forwardUrl+req.url+"被代理到："+loginUrl);
    var body = ''
    for(var key in json){
        if(body!=''){
            body += '&'
        }
        body += (key+"="+json[key])
    }
    // 登录
    var res = request('POST',loginUrl,{
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        method: req.method,
        body: body,
        followRedirects: false
    });
    // 返回值
    return res;
}
// 验证是否是手机号
function isPhone(username) {
    var myreg = /^[1][0-9]{10}$/;
    return myreg.test(username);
}

function processRedirectLocation(location,isNew){
    if(isNew==undefined){
        return location
            .replace(config.forwardUrlNewReg,config.forwardUrl)
            .replace(config.forwardUrlOldReg,config.forwardUrl);
    }
    if(isNew){
        return location.replace(config.forwardUrlNewReg,config.forwardUrl);
    }
    return location.replace(config.forwardUrlOldReg,config.forwardUrl);
}

console.log('Listening on http://localhost:%s...', config.PORT);
server.listen(config.PORT);

