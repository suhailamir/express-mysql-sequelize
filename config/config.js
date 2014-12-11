'use strict';
var winston = require('winston');
module.exports = function() {
    var conf = {
        serverName: 'express-demo'
    };
    conf.dbHost = 'localhost';
    conf.dbPort = '5432';
    conf.dbName = 'express-demo';
    conf.dbUserName = 'root';
    conf.dbPassword = '123';
    conf.redisHost = 'localhost';
    conf.redisPort = '6379';
    conf.logger = new(winston.Logger)({
        transports: [new(winston.transports.Console)({
            level: 'debug',
            emitErrs: true
        })]
    });
    return conf;
}();
