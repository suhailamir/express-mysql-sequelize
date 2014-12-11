var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
models = require('../models'),
config = require('./oauth.js')
module.exports = passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL
}, function(req,accessToken, refreshToken, profile, done) {
    models.User.find({
        where: {
            oauthID: profile.id
        }
    }).complete(function(err, user) {
        if (err) {
            
        }
        if (!err && user != null) {
            req.session.currUserId = user.id;
            req.session.currUsername = user.username;
            req.session.userAvatar = user.Avatar;
            req.session.userType = user.type;

            done(null, user);
        } else {
            models.User.create({
                oauthID: profile.id,
                username: profile.displayName,
                type: 'customer'
            }).complete(function(err, user) {
                if (err) {
                    
                } else {
                    req.session.currUserId = user.id;
                    req.session.currUsername = user.username;
                    req.session.userAvatar = user.Avatar;
                    req.session.userType = user.type;
                    done(null, user);
                }

            });
            passport.serializeUser(function(user, done) {
                done(null, user.id);
            });

            passport.deserializeUser(function(id, done) {
                done(null, 'juancito');
            });


        }
    });
}));

