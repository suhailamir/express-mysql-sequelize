/*
 * GET users listing.
 */
var models = require('../models'),
    currency = require('../routes/currency'),
    fs = require('fs'),
    moment = require('moment');

exports.verify = function(req, res) {

    if (req.body.username) {
        var username = req.body.username.toLowerCase();
        models.User.find({
            where: {
                username: username
            }
        }).success(function(_user) {
            if (_user) {
                res.send({
                    valid: false
                });
            } else {
                res.send({
                    valid: true
                });
            }
        });
    } else {
        res.send({
            valid: false
        })
    }
}
exports.services = function(req, res) {

    if (req.session.passport && req.session.passport.user) {
        models.User.find({
            where: {
                id: req.session.passport.user
            },
            include: [models.Currency]
        }).success(function(_user) {
            req.session.currUserId = _user.id;
            req.session.currUsername = _user.username;
            req.session.userAvatar = _user.Avatar;
            req.session.userType = _user.type;
            // res.redirect('/user/user-profile');
            models.Currency.findAll({}).complete(function(err, _currencies) {
                if (err) {
                    console.log(err);
                    res.send(err);

                } else {
                    req.session.currencies = _currencies;
                    var userCurrency;
                    var currencyCode;

                    if (_user.currency) {
                        console.log('currency exists');
                        req.session.currencyCode = _user.currency.Code;
                        req.session.currencyId = _user.currency.id;
                    } else {
                        console.log('facebook user');
                        req.session.currencyCode = 'USD';
                        req.session.currencyId = 3;
                    }
                    userCurrency = req.session.currencyId;
                    currencyCode = req.session.currencyCode;
                    var unirest = require('unirest');
                    unirest.get('https://currencyconverter.p.mashape.com/?from=USD&from_amount=1&to=' + currencyCode + '')
                        .header("X-Mashape-Key", "chWQItQsFzmsh3EhscfBZIklb1Mwp1eunuNjsnnC8GtGg0VubH")
                        .end(function(result) {
                            console.log('uni rest responce')
                            // console.log(result.status, result.headers, result.body);
                            console.log(result.body);
                            req.session.exRate = result.body.to_amount
                            console.log('exchange rate');
                            console.log(req.session.exRate);
                            if (req.session.currUsername == "admin") {
                                res.render('template_admin', {
                                    title: "Admin",
                                    username: req.session.currUsername,
                                })
                            } else if (req.session.userType == "merchant") {
                                models.Company.find({
                                    where: {
                                        UserId: req.session.currUserId
                                    }
                                }).complete(function(err, _company) {
                                    if (err) {
                                        console.log(err)
                                        res.send(err);
                                    } else {
                                        if (req.session.isNew) {
                                            console.log('new user');
                                            req.session.userAvatar = _company.Logo;
                                            res.redirect('/merchant-settings');
                                        } else {
                                            console.log('old user');
                                            console.log('currency :' + req.cookies.currency);
                                            req.session.userAvatar = _company.Logo;


                                            res.redirect('/service/Event');
                                        }

                                    }
                                })


                            } else if (req.session.userType == "customer") {
                                if (req.session.isNew) {
                                    console.log('req.param for faebook');
                                    console.log(req.param.returnUrl);

                                    console.log('new user');
                                    console.log('return url: ' + req.session.returnUrl)
                                    if (req.session.returnUrl) {
                                        res.redirect(req.session.returnUrl);
                                    } else {
                                        res.redirect('/user/user-profile');
                                    }




                                } else {
                                    console.log('req.param for faebook');
                                    console.log(req.param.returnUrl);
                                    console.log('old user');
                                    console.log('return url: ' + req.session.returnUrl);
                                    if (req.session.returnUrl) {
                                        res.redirect(req.session.returnUrl);
                                    } else {
                                        res.redirect('/Marketplace');
                                    }



                                }
                            }

                        });




                }





            });


        });
    }


}
exports.getNotifications = function(req, res) {
    var notifications = [];
    models.MerchantNotifications.findAll({
        include: [{
                model: db.Service,
                include: [db.serviceType]
            },
            db.User
        ]
    }).success(function(notifications) {
        if (notifications) {
            res.send(notifications);
        }
    });
}
exports.renderLogin = function(req, res) {

    returnURL = req.param("returnUrl");
    req.session.returnUrl = returnURL;
    res.render('login.html', {
        message: req.session.messages,
        returnUrl: returnURL
    });

};
exports.logout = function(req, res) {
    req.logout();
    // req.session=null;
    res.redirect('/');
};
exports.renderSignup = function(req, res) {
    returnURL = req.param("returnUrl");
    res.render("signup.html", {
        returnUrl: returnURL
    });
};
exports.renderMerchantSignup = function(req, res) {
    // res.render('plans',{
    //        event:Service.events.name
    //    });
    res.render("merchantSignup.html");

};
exports.signup = function(req, res, next) {
    var username = req.param('username').toString().toLowerCase();
    models.User.find({
        where: {
            username: username
        }
    }).complete(function(err, searchedUser) {
        if (!!err) {
            res.send(err);
        } else if (!searchedUser) {
            if (req.param('password') === req.param('confirm-password')) {
                if (req.files.uploadImage.name) {
                    saveProfilePicture(req, res);
                }
                models.User.create({
                    username: username,
                    password: req.param('password'),
                    Email: req.param('email'),
                    Avatar: req.files.uploadImage.name,
                    type: 'normal',
                    Company_Name: req.param('company_name')
                }).success(function(insertedUser) {
                    next();
                    // res.redirect("/login");
                });
            } else {
                res.send('Password Mismatch');
            }
        } else {
            res.send('Already Registered ' + searchedUser.username);
        }
    });

};
exports.signupMerchant = function(req, res, next) {
    var username = req.param('username').toString().toLowerCase();
    models.User.find({
        where: {
            username: username
        }
    }).complete(function(err, searchedUser) {
        if (!!err) {
            res.send(err);
        } else if (!searchedUser) {
            if (req.param('password') === req.param('confirmPassword')) {
                req.session.returnUrl = req.body.returnUrl;
                var userCurrency;
                // if (req.cookies.currency) {
                //     userCurrency = req.cookies.currency;
                //     console.log('user cookie currency:'+userCurrency);
                // } else {
                userCurrency = 3;
                // }
                models.User.create({
                    username: username,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    mobileNo: req.body.mobileNumber,
                    password: req.param('password'),
                    Email: req.param('email'),
                    CurrencyId: userCurrency,

                    // Avatar: req.files.uploadImage.name,
                    type: req.body.userType,
                    // Company_Name: req.param('company_name')
                }).success(function(insertedUser) {
                    req.session.isNew = true;
                    if (req.body.userType == 'merchant') {
                        models.Company.create({
                            Logo: '',
                            Name: username,
                            Location: 'abc',
                            UserId: insertedUser.id,
                            About: '',
                            paymentMethod: 'stripe',
                            PlanId: 1,
                            Latitude: 1.351798,
                            Longitude: 103.821851
                        }).success(function(_company) {

                            insertedUser.setCompanies([_company]);
                            req.session.currUserId = insertedUser.id;
                            req.session.businessId = _company.id;
                            var postData = {
                                username: insertedUser.username,
                                password: insertedUser.password
                            };

                        });
                        next();
                    } else {
                        next();
                    }
                });
            } else {
                res.send('Password Mismatch');
            }
        } else {
            res.send('Already Registered ' + searchedUser.username);
        }
    })
};
exports.createAdminUser = function(req, res) {
    models.User.find({
        where: {
            username: "admin"
        }
    }).complete(function(err, searchedUser) {
        if (!!err) {
            res.send(err);
        } else if (!searchedUser) {
            models.User.create({
                username: "admin",
                password: "admin123",
                admin: true
            }).success(function(insertedUser) {
                res.redirect('/');
            });
        } else {
            res.send('Already Registered ' + searchedUser.username);
        }
    })
};
exports.profile = function(req, res) {
    models.User.find({
        where: {
            id: req.session.currUserId
        }
    }).complete(function(err, profileUser) {
        if (!!err) {
            res.send(err);
        } else if (!profileUser) {
            res.redirect('/');
        } else {
            if (req.param('message')) {
                res.render("profile.html", {
                    profileUser: profileUser,
                    username: req.session.currUsername,
                    avatar: req.session.userAvatar,
                    message: "you have successfully edited your profile.",
                    className: "success",
                    title: "profile"
                });
            } else {
                res.render("profile.html", {
                    profileUser: profileUser,
                    username: req.session.currUsername,
                    avatar: req.session.userAvatar,
                    title: "profile"
                });
            }
        }
    });
};
exports.saveMerchantSettings = function(req, res) {
    var avatar;
    if (req.files.uploadImage.name) {
        avatar = req.files.uploadImage.name;
    }
    console.log('req.body');
    console.log(req.body);
    var userData = {
            firstName: req.param('firstName'),
            lastName: req.param('lastName'),
            mobileNo: req.param('mobileNo'),
            email: req.param('email'),

            // password: req.param('editPassword'),
            Email: req.param('email'),
            CurrencyId: req.param('currency'),


        },
        comapanyData = {
            Logo: avatar,
            Name: req.param('companyName'),
            CountryId: req.param('country'),
            Street: req.param('street'),
            City: req.param('city'),
            State: req.param('state'),
            PostalCode: req.param('postalCode'),
            Phone: req.param('phone'),
            fax: req.param('fax'),
            URL: req.param('url'),
            About: req.param('aboutMe'),
            Latitude: req.param('latitude'),
            Longitude: req.param('longitude'),
            facebook: req.param('facebook'),
            twitter: req.param('twitter'),
            youtube: req.param('youtube'),
            google: req.param('google'),
            tripAdvisor: req.param('tripadvisor'),

        };
    if (req.files) {

        fs.readFile(req.files.uploadImage.path, function(err, data) {
            var newPath = "./public/uploads/company/logo/" + req.files.uploadImage.name; // + req.session.currUserId; //__dirname + 
            fs.writeFile(newPath, data, function(err) {
                models.User.find({
                    where: {
                        id: req.session.currUserId
                    }
                }).complete(function(err, profileUser) {
                    if (!profileUser) {
                        res.send(err);
                    } else {
                        profileUser.updateAttributes(userData).success(function() {
                            models.Company.find({
                                where: {
                                    UserId: req.session.currUserId
                                }
                            }).complete(function(err, _company) {
                                _company.updateAttributes(comapanyData).success(function() {
                                    req.session.userAvatar = _company.Logo;
                                    res.redirect('/merchant-settings?message=updated');
                                });
                            });
                        });
                    }




                });
            });
        });
    } else {
        models.User.find({
            where: {
                id: req.session.currUserId
            }
        }).complete(function(err, profileUser) {
            if (!!err) {
                res.send(err);
            } else if (!profileUser) {} else {
                profileUser.updateAttributes(userData).success(function() {
                    models.Business.find({
                        where: {
                            admin: req.session.currUserId
                        }
                    }).complete(function(err, searchedBusiness) {
                        if (!!err) {
                            res.send("An error occurred while searching services");
                        } else if (!searchedBusiness) {
                            if (req.files.uploadImage.name) {
                                saveBussinessLogo(req, res);
                            }
                            models.Business.create(businessData).success(function(insertedUser) {
                                profileUser.setBusiness(insertedUser).success(function(user) {
                                    res.redirect('/settings/profile');
                                });
                            });
                        } else {
                            if (req.files.uploadImage.name) {
                                saveBussinessLogo(req, res);
                            }
                            searchedBusiness.updateAttributes(businessData).success(function() {
                                res.redirect('/settings/profile', {
                                    username: req.session.currUsername,
                                    avatar: req.session.userAvatar,
                                });
                            });
                        }
                    });
                });
            }
        });
    }
};
exports.updateProfilePicture = function(req, res) {
    if (req.files) {
        fs.readFile(req.files.uploadImage.path, function(err, data) {
            var newPath = "./public/uploads/company/logo/" + req.session.currUserId + ".png";
            fs.writeFile(newPath, data, function(err) {
                res.redirect('/settings/profile?message=updated', {
                    username: req.session.currUsername,
                    avatar: req.session.userAvatar,
                    title: "profile",
                    message: "you have successfully updated your profile.",
                    className: "success"

                });
            });
        });
    } else {
        res.send("No File Uploaded");
    }
};
exports.payout = function(req, res) {
    models.User.find({
        where: {
            id: req.session.currUserId
        }
    }).success(function(_user) {
        if (!_user) {
            res.send('No user found');
        } else {
            res.render('payout', {
                user: _user,
                username: req.session.currUsername,
                avatar: req.session.userAvatar,
                title: "payout"
            });
        }
    });
}
exports.savePayout = function(req, res) {
    models.User.update({
        bankName: req.body.bankName,
        zipCode: req.body.zipCode,
        branchAddress: req.body.branchAddress,
        bankName: req.body.bankName,
        bankCode: req.body.bankCode,
        branchCode: req.body.branchCode,
        accountNumber: req.body.accountNumber,
        paypalEmail: req.body.paypalEmail
    }, {
        id: req.session.currUserId,
    }).success(function() {
        models.Company.update({
            paymentMethod: req.body.paymentMethod,
            StripeEmail: req.param('stripeEmail'),
            StripeTaxId: req.param('stripeTaxId'),
            PaypalEmail: req.param('paypalEmail')

        }, {
            UserId: req.session.currUserId
        }).success(function() {
            res.redirect('/merchant-settings');
        });

    });
}
exports.planType = function(req, res) {
    var plan;
    models.Plan.findAll({}).success(function(_plan) {
        if (!_plan) {
            res.send('No plan found');
        } else {
            models.User.find({
                where: {
                    id: req.session.currUserId
                }
            }).success(function(_user) {
                if (!_user) {
                    res.send('No user found');
                } else {
                    res.render('planType', {
                        user: _user,
                        plans: _plan,
                        username: req.session.currUsername,
                        avatar: req.session.userAvatar,
                        title: "plan-type"
                    });
                }
            });
        }
    });

}
exports.savePlanType = function(req, res) {
    models.User.update({
        plan: req.body.plan,
    }, {
        id: req.session.currUserId,
    }).success(function() {
        res.redirect('/merchant-settings');
    });
}

function saveProfilePicture(req, res) {
    var fs = require('fs');
    var gm = require('gm').subClass({
        imageMagick: true
    });
    var tmp_path = req.files.uploadImage.path;

    var target_path = './public/uploads/user/' + req.files.uploadImage.name;

    if (req.files.uploadImage) {
        fs.rename(tmp_path, target_path, function(err) {
            if (err) res.send(err);
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
            fs.unlink(tmp_path, function() {
                if (err) res.send(err);
                else {
                    msg = "File uploaded sucessfully"
                    gm(target_path)
                        .resize(50, 50)
                        .noProfile()
                        .write('./public/uploads/user/profile/' + req.files.uploadImage.name, function(err) {
                            if (err)
                                res.send(err)
                            else {

                            }
                        });

                }
            });
        });


    } else {
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
        fs.unlink(tmp_path, function(err) {
            if (err) res.send(err);
        });
        msg = "File upload failed.File extension not allowed and size must be less than ";
    }
}

function saveBussinessLogo(req, res) {
    var fs = require('fs');
    var gm = require('gm').subClass({
        imageMagick: true
    });
    var tmp_path = req.files.uploadImage.path;

    var target_path = './public/uploads/bussiness/' + req.files.uploadImage.name;
    if (req.files.uploadImage) {
        fs.rename(tmp_path, target_path, function(err) {
            if (err) res.send(err);
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
            fs.unlink(tmp_path, function() {
                if (err) res.send(err);
                else {
                    msg = "File uploaded sucessfully"
                    gm(target_path)
                        .resize(50, 50)
                        .noProfile()
                        .write('./public/uploads/bussiness/logo/' + req.files.uploadImage.name, function(err) {
                            if (err)
                                res.send(err)
                            else {

                            }
                        });

                }
            });
        });


    } else {
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
        fs.unlink(tmp_path, function(err) {
            if (err) res.send(err);
        });
        msg = "File upload failed.File extension not allowed and size must be less than ";
    }
}

function saveCompanyLogo(req, res) {
    var fs = require('fs');
    var gm = require('gm').subClass({
        imageMagick: true
    });
    var tmp_path = req.files.uploadLogo.path;

    var target_path = './public/uploads/company/' + req.files.uploadLogo.name;
    if (req.files.uploadLogo) {
        fs.rename(tmp_path, target_path, function(err) {
            if (err) res.send(err);
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
            fs.unlink(tmp_path, function() {
                if (err) res.send(err);
                else {
                    msg = "File uploaded sucessfully"
                    gm(target_path)
                        .resize(200, 450)
                        .noProfile()

                    .write('./public/uploads/company/logo/' + req.files.uploadLogo.name, function(err) {
                        if (err)
                            res.send(err)
                        else {

                        }
                    });

                }
            });
        });


    } else {
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files 
        fs.unlink(tmp_path, function(err) {
            if (err) res.send(err);
        });
        msg = "File upload failed.File extension not allowed and size must be less than ";
    }
}

exports.templateUser = function(req, res) {

    res.render('templateUser')
}

exports.addToFavorites = function(req, res) {

    models.AddToFavorites.create({
        CompanyId: req.param("companyId"),
        UserId: req.session.currUserId
    }).success(function() {
        db.MerchantNotifications.create({
            ServiceId: req.param("serviceId"),
            UserId: req.session.currUserId,
            type: 1
        }).success(function(effectedRows) {
            res.redirect("/user/user-favorites");
        });
    });

}
exports.addToFollowing = function(req, res) {

    models.AddToFavorites.create({
        CompanyId: req.param("companyId"),
        UserId: req.session.currUserId
    }).success(function() {
        db.MerchantNotifications.create({
            ServiceId: req.param("serviceId"),
            UserId: req.session.currUserId,
            type: 1
        }).success(function(effectedRows) {
            res.send(200);
        });
    });
}
exports.removeFromFollowing = function(req, res) {
    models.AddToFavorites.find({
        where: {
            CompanyId: req.param("companyId"),
            UserId: req.session.currUserId
        }
    }).success(function(_AddToFavorites) {

        _AddToFavorites.destroy();
        res.send(200);
        // db.MerchantNotifications.destroy(
        // {
        //     ServiceId: req.param("serviceId"),
        //     UserId: req.session.currUserId,
        //     type:1
        // }).success(function(effectedRows){
        //                 res.send(200);
        //             });

    });
}
exports.merchantSettings = function(req, res) {
    db.Page.findAll({
        where: {
            Name: ['facebook', 'tripAdvisor', 'companyWebsite']
        }
    })
        .success(function(_page) {
            var facebookContent = "";
            var tripAdvisorContent = "";
            var companyWebsiteContent = "";
            for(var i = 0; i < _page.length; i++){
                if(_page[i].Name == "facebook"){
                    facebookContent = _page[i].Content;
                }
                else if(_page[i].Name == "tripAdvisor"){
                    tripAdvisorContent = _page[i].Content;

                }
                else if(_page[i].Name == "companyWebsite"){
                    companyWebsiteContent = _page[i].Content;

                }

            }
            models.User.find({
                where: {
                    id: req.session.currUserId
                },
                include: [models.Currency]
            }).complete(function(err, profileUser) {
                models.Plan.findAll({}).success(function(_plan) {
                    if (!_plan) {
                        res.send('No plan found');
                    } else {
                        models.Country.findAll().success(function(_countries) {
                            models.Company.find({
                                where: {
                                    UserId: req.session.currUserId
                                },
                                include: [db.Country]
                            }).complete(function(err, _company) {

                                console.log('company');
                                console.log(_company);
                                if (err) {
                                    res.send(err);
                                } else {
                                    models.Currency.findAll({}).complete(function(err, _currency) {
                                        if (err) {
                                            console.log(err);
                                            res.send(err);
                                        } else {
                                            if (req.param('message')) {

                                                res.cookie('currency', req.cookies.currency).render("settings", {
                                                    currencies: _currency,
                                                    coookieCurrency: req.session.currencyId,
                                                    profileUser: profileUser,
                                                    company: _company,
                                                    username: req.session.currUsername,
                                                    avatar: req.session.userAvatar,
                                                    user: profileUser,
                                                    plans: _plan,
                                                    countries: _countries,
                                                    message: "you have successfully edited your profile.",
                                                    className: "success",
                                                    title: "profile",
                                                    facebook: facebookContent,
                                                    tripAdvisor: tripAdvisorContent,
                                                    companyWebsite: companyWebsiteContent
                                                });
                                            } else {
                                                res.cookie('currency', req.cookies.currency).render("settings", {
                                                    currencies: _currency,
                                                    coookieCurrency: req.session.currencyId,
                                                    profileUser: profileUser,
                                                    company: _company,
                                                    username: req.session.currUsername,
                                                    avatar: req.session.userAvatar,
                                                    user: profileUser,
                                                    plans: _plan,
                                                    countries: _countries,
                                                    facebook: facebookContent,
                                                    tripAdvisor: tripAdvisorContent,
                                                    companyWebsite: companyWebsiteContent
                                                });

                                            }

                                        }



                                    });


                                }
                            });
                        });
                    }
                });
            });


        });
    // console.log(pages);
    // console.log('not finding any page');



}
exports.payments = function(req, res) {
    models.Company.find({
        where: {
            UserId: req.session.currUserId
        }
    }).success(function(_company) {
        res.render('merchantPayments', {
            company: _company,
            view: 'payment',
            username: req.session.currUsername,
            avatar: req.session.userAvatar,

        });

    });
}
exports.requestWithdraw = function(req, res) {
    if (req.param('type') == 'Stripe') {
        var withDrawAmount = parseInt(req.body.amount);
        models.Company.find({
            where: {
                id: req.body.companyId
            }
        }).success(function(_company) {
            var stripeBalance = parseInt(_company.StripeBalance);
            var balance = stripeBalance - withDrawAmount;
            _company.updateAttributes({
                StripeBalance: balance
            }).success(function(_records) {
                models.MerchantWithdraw.create({
                    Amount: req.body.amount,
                    Type: req.param('type'),
                    UserId: req.session.currUserId,
                    CompanyId: req.body.companyId
                }).success(function(_withdraw) {
                    res.redirect('/merchant/payments');
                    // res.render('template', {
                    //     message: "Your Withdraw request has been posted to Admin.",
                    //     messageType: "notification",
                    //     title: "Withdraw",
                    //     className: "info",
                    //     username: req.session.currUsername,
                    //     avatar: req.session.userAvatar,
                    // })


                })


            })
        })
    } else if (req.param('type') == 'Paypal') {
        var withDrawAmount = parseInt(req.body.amount);
        models.Company.find({
            where: {
                id: req.body.companyId
            }
        }).success(function(_company) {
            var paypalBalance = parseInt(_company.PaypalBalance);
            var balance = paypalBalance - withDrawAmount;
            _company.updateAttributes({
                PaypalBalance: balance
            }).success(function(_records) {
                models.MerchantWithdraw.create({
                    Amount: req.body.amount,
                    Type: req.param('type'),
                    UserId: req.session.currUserId,
                    CompanyId: req.body.companyId
                }).success(function(_withdraw) {
                    res.redirect('/merchant/payments');

                    // res.render('template', {
                    //     message: "Your Withdraw request has been posted to Admin.",
                    //     messageType: "notification",
                    //     title: "Withdraw",
                    //     className: "info",
                    //     username: req.session.currUsername,
                    //     avatar: req.session.userAvatar,
                    // });
                });


            })
        })
    }

}
exports.withdrawRequests = function(req, res) {
    models.MerchantWithdraw.findAll({
        include: [models.Company, models.User]
    }).complete(function(err, _requests) {
        res.render('withdrawRequests', {
            withdraws: _requests

        })

    })
}
exports.allUsers = function(req, res) {
    models.User.findAll().complete(function(err, _users) {
        if (err) {
            res.send(err);
        } else {

            res.send(_users);
        }
    })
}
