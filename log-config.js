const config = require('config')
var log4js = require('log4js');

const level = config.logLevel || 'all'  //使用配置文件中的logLevel，如果没有配置，默认log级别为all
log4js.configure({
    appenders: {
        xcLogFile: {
            type: "dateFile",
            filename: __dirname +'/logs/LogFile',//
            alwaysIncludePattern: true,
            pattern: "-yyyy-MM-dd.log",
            encoding: 'utf-8',//default "utf-8"，文件的编码
            maxLogSize: 11024 }, //文件最大存储空间
        xcLogConsole: {
            type: 'console'
        }
    },
    categories: {
        default: {
            appenders: ['xcLogFile','xcLogConsole'],
            level: log4js.levels.getLevel(level)
        },
        xcLogFile: {
            appenders: ['xcLogFile'],
            level: log4js.levels.getLevel(level)
        },
        xcLogConsole: {
            appenders: ['xcLogConsole'],
            level: log4js.levels.getLevel(level)
        }
    }
});
module.exports.default = log4js.getLogger('xcLogFile');
module.exports.console = log4js.getLogger('xcLogConsole');
