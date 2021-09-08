module.exports = {
    ensureAuth: function(req, res, next) {
        if(req.isAuthenticated() && (req.user.emailConfirmed || req.user.site !== "main")) {
            return next()
        } else {
            res.redirect('/')
        }
    },
    ensureGuest: function(req, res, next) {
        if(req.isAuthenticated()) {
            res.redirect('/')
        } else {
            return next()
        }
    }
}