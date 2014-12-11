// route middleware to make sure a user is logged in
exports.isLoggedIn = function(req, res, next) {
    // // if user is authenticated in the session, carry on 
    if (req.session.currUserId)
        return next();
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/login');
}


exports.isLoggedInAlready = function(req, res, next) {
    // // if user is authenticated in the session, carry on 
    if (req.isAuthenticated()) {

        if (req.session.userType == "admin") {
            res.render('template_admin', {
                title: "Admin",
                username: req.session.currUsername,
            })

        } else if (req.session.userType == "merchant") {
            res.redirect('/service/' + Service.events.name);
        } else {

            res.redirect('/user/user-profile');
        }
    } else
        return next();
    // if they aren't redirect them to the home page

}
