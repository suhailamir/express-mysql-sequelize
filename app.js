/**
 * Module dependencies.
 */
'use strict';
var express = require('express');
var passport = require('passport');
require('./config/passport')(passport);
var auth = require('./config/passport');
var helper = require('./helpers/helpers');
var http = require('http');
var RedisStore = require('connect-redis')(express.session);
var fs = require('fs');
var path = require('path');
var cons = require('consolidate');
var conf = require('./config/config.js');
var passport = require('passport');
var app = express();
app.engine('html', cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(express.bodyParser());
app.use(passport.initialize());
app.use(passport.session({
    secret: "someSecretKey",
    store: new RedisStore({
        host: conf.redisHost,
        port: conf.redisPassword
    })
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, '/public')));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, 'juancito');
});




// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

// Routes for Services


//Synchronizing models
models.sequelize.sync({
       force: true
}).complete(function(err) {
    if (err) {
        // throw err
    } else {
        http.createServer(app).listen(deployConf.port, deployConf.ip, function() {
            console.log("http server listening at " + deployConf.port);
           });
        
    }
});
