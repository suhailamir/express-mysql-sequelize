var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

models = require('../models'),
config = require('./oauth.js')
module.exports = function(req, res) {
    passport.use('local-login', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function(req, username, password, done) {
            var user;
            models.User.find({
                where: {
                    username: username.toString().toLowerCase(),
                    password: password
                }
            }).complete(function(err, _user) {
                user = _user;

                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {
                        message: 'Incorrect username/Password.'
                    });
                }
                if (_user) {
                    req.session.currUserId = user.id;
                    req.session.currUsername = user.username;
                    return done(null, user);

                }

            });

        }));
    // passport.use(new FacebookStrategy({
    //     clientID: config.facebook.clientID,
    //     clientSecret: config.facebook.clientSecret,
    //     callbackURL: config.facebook.callbackURL
    // }, function(accessToken, refreshToken, profile, done) {
        
    //     models.User.find({
    //         where: {
    //             oauthID: profile.id
    //         }
    //     }).complete(function(err, _user) {
    //         if (err) {
               
    //         } else if (!err && _user != null) {
    //             req.session.currUserId = _user.id;
    //             req.session.currUsername = _user.username;
    //             req.session.userAvatar = _user.Avatar;
    //             req.session.userType = _user.type;
    //             // req.session.FbUser=_user.FbUser;
    //             return done(null, _user);
    //         } else {
    //             models.User.create({
    //                 oauthID: profile.id,
    //                 username: profile.displayName,
    //                 type: 'customer',
    //                 Avatar:"http://graph.facebook.com/" + profile.id + "/picture",
    //                 CurrencyId:3,
    //                 // FbUser:true
    //             }).complete(function(err, _user) {
    //                 if (err) {
                        
    //                 } else {
    //                     req.session.currUserId = _user.id;
    //                     req.session.currUsername = _user.username;
    //                     req.session.userAvatar = _user.Avatar;
    //                     req.session.userType = _user.type;
    //                     req.session.isNew = true;
    //                     return done(null, _user);
    //                 }

    //             });
             


    //         }
    //     });
    // }));
    // passport.use(new TwitterStrategy({
    //     consumerKey: config.twitter.consumerKey,
    //     consumerSecret: config.twitter.consumerSecret,
    //     callbackURL: config.twitter.callbackURL
    // }, function(accessToken, refreshToken, profile, done) {
    //     // console.log('twitter data');
    //     // console.log(profile);
    //     models.User.find({
    //         where: {
    //             oauthID: profile.id
    //         }
    //     }).complete(function(err, _user) {
    //         if (err) {
               
    //         } else if (!err && _user != null) {
    //             req.session.currUserId = _user.id;
    //             req.session.currUsername = _user.username;
    //             req.session.userAvatar = _user.Avatar;
    //             req.session.userType = _user.type;
    //             return done(null, _user);
    //         } else {
    //             models.User.create({
    //                 oauthID: profile.id,
    //                 username: profile.displayName,
    //                 type: 'customer',
    //                  Avatar:"https://pbs.twimg.com/profile_images/"+profile.id+"/aHe5lLH5_bigger.png",
                    
    //             }).complete(function(err, _user) {
    //                 if (err) {
                       
    //                 } else {
    //                     req.session.currUserId = _user.id;
    //                     req.session.currUsername = _user.username;
    //                     req.session.userAvatar = _user.Avatar;
    //                     req.session.userType = _user.type;
    //                     req.session.isNew = true;
    //                     return done(null, _user);
    //                 }

    //             });
                


    //         }
    //     });
    // }));
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        done(null, 'juancito');
    });


};
module.exports.login = passport.authenticate('local-login', {
    successRedirect: '/welcome',
    failureRedirect: '/login',
});
