const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Recipe = require('../models/Recipe')
const Code = require('../models/Code')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const { v4: uuid_v4 } = require('uuid');
const { ensureAuth, ensureGuest } = require('../middleware/auth')
const { upload } = require('../middleware/multer')
const { getMaxListeners } = require('../models/User')
const nodemailer = require('nodemailer');
const passport = require('passport')
const mongoose = require('mongoose')

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'christianinskokie@gmail.com',
      pass: process.env.EMAIL_PWORD
    }
});

// @desc     Home page
// @route    GET /
router.get('/', async (req, res) => {
    const recipes = await Recipe.find()
    var total = 0;
    var totalRec = 0;
    for(var i = 0; i < recipes.length; i++) {
        total += recipes[i].rateValue
        if(recipes[i].rateCount > 0) {
            totalRec++
        }
    }
    var avg = total/parseFloat(totalRec)
    recipes.sort((a, b) => a.rateCount > b.rateCount ? 1 : -1)
    var quart = recipes[recipes.length/4]
    recipes.sort((a, b) => ((a.rateValue+quart*avg)/(a.rateCount+quart) > (b.rateValue+quart*avg)/(b.rateCount+quart)) ? 1 : -1)
    res.render('layouts/main', {
        body: 'index',
        user: req.user,
        recipes
    })
})

// @desc     Login page
// @route    GET /login
router.get('/login', ensureGuest, (req, res) => {
    res.render('layouts/login', {
        body: 'login',
        noUser: false,
        incorrectPword: false
    })
})

router.post('/login', function(req, res, next) {
    passport.authenticate('local', async(err, user, info) => {
        var noUser = true
        var incorrectPword = false
        if (err) { return next(err); }
        let thisUser = await User.findOne({
            site: 'main',
            userName: req.body.username
        })
        if(thisUser) {
            noUser = false
            if(!bcrypt.compareSync(req.body.password, thisUser.password)) {
                incorrectPword = true
            }
        }
        if (!user) {
            return res.render('layouts/login', {
                body: 'login',
                noUser: noUser,
                incorrectPword: incorrectPword,
                username: req.body.username,
                password: req.body.password
            })
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/');
        });
    })(req, res, next);
});

// @desc     Sign up page
// @route    GET /sign-up
router.get('/sign-up', ensureGuest, (req, res) => {
    res.render('layouts/login', {
        body: 'sign-up',
        emailTaken: false,
        nameTaken: false,
        shortPassword: false
    })
})

router.post('/sign-up', upload.single('image'), async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hashSync(req.body.password, 10)
        if(req.file) {
            var filePath = process.env.ROOT_URL + req.file.path.substring(7)
        } else {
            var filePath = "https://grandimageinc.com/wp-content/uploads/2015/09/icon-user-default.png"
        }
        const newUser = {
            site: 'main',
            userID: 0,
            userName: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            displayName: req.body.firstName + " " + req.body.lastName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            image: filePath
        }

        try {
            if(req.body.firstName === "") {
                var noFirstName = true;
            } else {
                var noFirstName = false;
            }
            if(req.body.lastName === "") {
                var noLastName = true;
            } else {
                var noLastName = false;
            }
            if(req.body.username === "") {
                var noUsername = true;
            } else {
                var noUsername = false;
            }
            if(req.body.email === "") {
                var noEmail = true;
            } else {
                var noEmail = false;
            }
            let user = await User.findOne({
                site: 'main',
                userName: req.body.username
            })
            if(user) {
                var isUser = true;
            } else {
                var isUser = false;
            }
            let emailUser = await User.findOne({
                site: 'main',
                email: req.body.email,
                emailConfirmed: true
            })
            if(emailUser) {
                var emailTaken = true;
            } else {
                var emailTaken = false;
            }
            if(req.body.password === "") {
                var noPassword = true;
            } else {
                var noPassword = false;
                if(req.body.password.length < 8) {
                    var isShort = true;
                } else {
                    var isShort = false;
                }
            }
            if(isUser || isShort || noFirstName || noLastName || noUsername || noPassword || emailTaken) {
                res.render('layouts/login', {
                    body: 'sign-up',
                    nameTaken: isUser,
                    shortPassword: isShort,
                    emailTaken: emailTaken,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    username: req.body.username,
                    email: req.body.email,
                    password: req.body.password
                })
            } else {
                user = await User.create(newUser)
                req.login(user, function(err) {
                    if (err) { return next(err); }
                    return res.redirect(`/confirm-email?user=${user._id}`);
                })
            }
        } catch(err) {
            console.error(err)
            res.status(500).render('layouts/main', {
                body: 'error/500',
                user: req.user
            })
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/user/:userID', async (req, res) => {
    let user = await User.findById(req.params.userID).lean()

    if(req.user && req.user._id.str === user._id.str) {
        var canEdit = true;
    } else {
        var canEdit = false;
    }

    let recipes = await Recipe.find({
        user: user
    })

    res.render('layouts/main', {
        body: 'profile',
        user: req.user,
        profileUser: user,
        recipes,
        canEdit: canEdit,
        tooShort: false,
        wrongPword: false
    })
})

router.post('/search', async (req, res) => {
    if(req.body.submit_from === "header") {
        res.redirect('/search?q='+req.body.search)
    } else {
        var url = '/search?q='+req.body.search
        if(req.body.includes !== undefined) {
            for(var i = 0; i < req.body.includes.length; i++) {
                if(req.body.includes[i] !== "") {
                    url += '&inc='+req.body.includes[i]
                }
            }
        }
        if(req.body.excludes !== undefined) {
            for(var i = 0; i < req.body.excludes.length; i++) {
                if(req.body.excludes[i] !== "") {
                    url += '&exc='+req.body.excludes[i]
                }
            }
        }
        res.redirect(url)
    }
})

router.get('/search', async (req, res) => {
    if(req.query.q) {
        var q = req.query.q
    } else {
        var q = ""
    }
    if(req.query.inc) {
        var inc = req.query.inc
    } else {
        var inc = []
    }
    if(!Array.isArray(inc)) {
        inc = [inc]
    }
    if(req.query.exc) {
        var exc = req.query.exc
    } else {
        var exc = []
    }
    if(!Array.isArray(exc)) {
        exc = [exc]
    }
    const recipes = await Recipe.find({
        $or: [
            {'title' : {$regex : q, '$options' : 'i'}},
            {'desc' : {$regex : q, '$options' : 'i'}}
        ]
    })
    res.render('layouts/main', {
        body: 'search',
        user: req.user,
        query: q,
        inc: inc,
        exc: exc,
        recipes
    })
})

router.post('/change-image', upload.single('image'), async(req, res) => {
    try {
        if(req.file && req.user) {
            var filePath = process.env.ROOT_URL + req.file.path.substring(7)
            User.findOneAndUpdate({_id: req.user._id}, {image: filePath},
                function( error, result){
                })
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})



router.post('/change-name', async (req, res) => {
    if(req.body.displayName.indexOf(" ") == -1) {
        var firstName = req.body.displayName
        var lastName = ""
    } else {
        var firstName = req.body.displayName.substring(0, req.body.displayName.indexOf(" "))
        var lastName = req.body.displayName.substring(req.body.displayName.indexOf(" ") + 1)
    }
    try {
        if(req.user) {
            User.findOneAndUpdate({_id: req.user._id}, {firstName: firstName, lastName: lastName, displayName: req.body.displayName},
            function( error, result){
            })
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.post('/change-desc', async (req, res) => {
    try {
        if(req.user) {
            User.findOneAndUpdate({_id: req.user._id}, {desc: req.body.desc},
            function( error, result){
            })
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.post('/user/:userID', async (req, res) => {
    try {
        let user = await User.findById(req.params.userID).lean()

        if(req.user && req.user._id.str === user._id.str) {
            var canEdit = true;
        } else {
            var canEdit = false;
        }
        if(canEdit) {
            if(req.body.old_password && req.body.new_password.length >= 8) {
                const newHashedPassword = await bcrypt.hashSync(req.body.new_password, 10)
                if(bcrypt.compareSync(req.body.old_password, req.user.password)) {
                    User.findOneAndUpdate({_id: req.user._id}, {password: newHashedPassword},
                    function( error, result){
                    })
                }
            } else {
                let recipes = await Recipe.find({
                    user: user
                })
                if(req.body.new_password.length < 8) {
                    var tooShort = true
                } else {
                    var tooShort = false
                }
                if(!bcrypt.compareSync(req.body.old_password, req.user.password)) {
                    var wrongPword = true
                } else {
                    var wrongPword = false
                }
                if(tooShort || wrongPword) {
                    res.render('layouts/main', {
                        body: 'profile',
                        user: req.user,
                        profileUser: user,
                        recipes,
                        canEdit: canEdit,
                        tooShort: tooShort,
                        wrongPword: wrongPword,
                        oldPassword: req.body.old_password,
                        newPassword: req.body.new_password
                    })
                }
            }
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/confirm-email', async (req, res) => {
    try {
        if(req.query.user) {
            var user = await User.findOne({_id: req.query.user})
            var email = user.email
            var confCode = uuid_v4()
            const hashedCode = await bcrypt.hashSync(confCode, 10)
            const newCode = {
                user: user,
                value: hashedCode
            }
            var code = await Code.create(newCode)
            var mailOptions = {
                from: 'christianinskokie@gmail.com',
                to: email,
                subject: 'Confirm your email address',
                html:  `<div style='font-family: Helvetica; position: absolute; left: 0; top: 0; width: 100%; display: flex; padding: 5px 0;'><div style='background: white; border: 1px solid #e5e5e5; width: 600px; margin: 0 auto; padding: 20px;'><div style='position: relative; left: 0; width: 100%; color: blue; font-size: 30px;'>Welcome to the Recipes App!</div><p style="color: black">Hello ${user.firstName},</p><p style="color: black">Please click the link below to confirm your email address</p><a href='https://127.0.0.1:3000/confirmation-code?user=${user._id}&code=${confCode}'>https://127.0.0.1:3000/confirmation-code?user=${user._id}&code=${confCode}</a><p style="color: black">If you didn't create a Recipes account, please ignore this message.</p></div></div>`
            };
            
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.render('layouts/main', {
                body: 'confirm-email',
                user: req.user,
                emailUser: req.query.user,
                email: email
            })
        } else {
            res.status(404).render('layouts/main', {
                body: 'error/404',
                user: req.user
            })
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/confirmation-code', async (req, res) => {
    if(req.query.code) {
        var code = req.query.code
    } else {
        var code = ""
    }
    if(req.query.user) {
        var codeUser = req.query.user
    } else {
        var codeUser = ""
    }
    var user = await User.findOne({_id: codeUser})
    if(user) {
        let emailUser = await User.findOne({
            site: 'main',
            email: user.email,
            emailConfirmed: true
        })
        if(emailUser) {
            if(emailUser.id === codeUser) {
                res.redirect('/email-confirmed')
            } else {
                res.redirect('/email-taken')
            }
        } else {
            const codes = await Code.find({
                user: user,
                createdAt: { $gt: new Date(Date.now() - 24*60*60 * 1000) }
            })
            codes.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
            console.log(codes[0].value)
            console.log(code)
            if(codes.length > 0 && bcrypt.compareSync(code, codes[0].value)) {
                User.findOneAndUpdate({_id: codeUser}, {emailConfirmed: true},
                    function( error, result){
                    })
                Code.deleteMany({ user: user })
                res.redirect('/email-confirmed')
            } else {
                res.status(404).render('layouts/main', {
                    body: 'error/404',
                    user: req.user
                })
            }
        }
    } else {
        res.status(404).render('layouts/main', {
            body: 'error/404',
            user: req.user
        })
    }
})

router.post('/resend-code', async (req, res) => {
    try {
        if(req.body.user) {
            var user = await User.findOne({_id: req.body.user})
        }
        if(user) {
            if(req.body.email && req.body.email !== "") {
                var email = req.body.email
                User.findOneAndUpdate({_id: user._id}, {email: email},
                    function( error, result){
                    })
            } else {
                var email = ""
            }
            var confCode = uuid_v4()
            const hashedCode = await bcrypt.hashSync(confCode, 10)
            const newCode = {
                user: user,
                value: hashedCode
            }
            var code = await Code.create(newCode)
            console.log("hi" + newCode.value)
            var mailOptions = {
                from: 'christianinskokie@gmail.com',
                to: email,
                subject: 'Confirm your email address',
                html:  `<div style='font-family: Helvetica; position: absolute; left: 0; top: 0; width: 100%; display: flex; padding: 5px 0;'><div style='background: white; border: 1px solid #e5e5e5; width: 600px; margin: 0 auto; padding: 20px;'><div style='position: relative; left: 0; width: 100%; blue; font-size: 30px;'>Welcome to the Recipes App!</div><p style="color: black">Hello ${user.firstName},</p><p style="color: black">Please click the link below to confirm your email address</p><a href='https://127.0.0.1:3000/confirmation-code?user=${user._id}&code=${confCode}'>https://127.0.0.1:3000/confirmation-code?user=${user._id}&code=${confCode}</a><p style="color: black">If you didn't create a Recipes account, please ignore this message.</p></div></div>`
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/email-confirmed', async (req, res) => {
    res.render('layouts/main', {
        body: 'email-confirmed',
        user: req.user
    })
})

router.get('/email-taken', async (req, res) => {
    res.render('layouts/main', {
        body: 'email-taken',
        user: req.user
    })
})

router.get('/forgot-password', async (req, res) => {
    res.render('layouts/login', {
        body: 'forgot-password',
        user: req.user,
        noAccount: false,
        emailSent: false
    })
})

router.post('/forgot-password', async (req, res) => {
    try {
        let user = await User.findOne({
            site: 'main',
            email: req.body.email,
            emailConfirmed: true
        })
        if(user) {
            var confCode = uuid_v4()
            const hashedCode = await bcrypt.hashSync(confCode, 10)
            const newCode = {
                user: user,
                value: hashedCode
            }
            var code = await Code.create(newCode)
            var mailOptions = {
                from: 'christianinskokie@gmail.com',
                to: req.body.email,
                subject: 'Change your password',
                html:  `<div style='font-family: Helvetica; position: absolute; left: 0; top: 0; width: 100%; display: flex; padding: 5px 0;'><div style='background: white; border: 1px solid #e5e5e5; width: 600px; margin: 0 auto; padding: 20px;'><div style='position: relative; left: 0; width: 100%; blue; font-size: 30px;'>Welcome to the Recipes App!</div><p style="color: black">Hello ${user.firstName},</p><p style="color: black">Please click the link below to confirm your email address</p><a href='https://127.0.0.1:3000/change-password?user=${user._id}&code=${confCode}'>https://127.0.0.1:3000/change-password?user=${user._id}&code=${confCode}</a><p style="color: black">If you didn't intend to send this email, please ignore this message.</p></div></div>`
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.render('layouts/login', {
                body: 'forgot-password',
                user: req.user,
                noAccount: false,
                emailSent: true
            })
        } else {
            res.render('layouts/login', {
                body: 'forgot-password',
                user: req.user,
                noAccount: true,
                email: req.body.email,
                emailSent: false
            })
        }
    } catch {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/change-password', async (req, res) => {
    if(req.query.code) {
        var code = req.query.code
    } else {
        var code = ""
    }
    if(req.query.user) {
        var codeUser = req.query.user
    } else {
        var codeUser = ""
    }
    var user = await User.findOne({_id: codeUser})
    if(user) {
        const codes = await Code.find({
            user: user,
            createdAt: { $gt: new Date(Date.now() - 24*60*60 * 1000) }
        })
        codes.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
        if(codes.length > 0 && bcrypt.compareSync(code, codes[0].value)) {
            var codeWorks = true
        } else {
            var codeWorks = false
        }
    } else {
        var codeWorks = false
    }
    if(!codeWorks) {
        res.redirect('/wrong-code')
    } else {
        res.render('layouts/login', {
            body: 'change-password',
            code: code,
            codeUser: codeUser,
            user: req.user,
            shortPassword: false
        })
    }
})

router.post('/change-password', async (req, res) => {
    try {
        if(req.body.code) {
            var code = req.body.code
        } else {
            var code = ""
        }
        if(req.body.codeUser) {
            var codeUser = req.body.codeUser
        } else {
            var codeUser = ""
        }
        if(mongoose.Types.ObjectId.isValid(codeUser)) {
            var user = await User.findOne({_id: codeUser})
            if(user) {
                const codes = await Code.find({
                    user: user,
                    createdAt: { $gt: new Date(Date.now() - 24*60*60 * 1000) }
                })
                codes.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
                if(codes.length > 0 && bcrypt.compareSync(code, codes[0].value)) {
                    if(req.body.password === "") {
                        var noPassword = true
                    } else {
                        var noPassword = false
                    }
                    if(req.body.password.length < 8) {
                        var isShort = true;
                    } else {
                        var isShort = false;
                    }
                    if(noPassword || isShort) {
                        res.render('layouts/login', {
                            body: 'change-password',
                            code: code,
                            codeUser: codeUser,
                            user: req.user,
                            shortPassword: isShort
                        })
                    } else {
                        var hashedPassword = await bcrypt.hashSync(req.body.password, 10)
                        User.findOneAndUpdate({_id: codeUser}, {password: hashedPassword},
                            function( error, result){
                            })
                        Code.deleteMany({ user: user })
                        res.redirect('/password-updated')
                    }
                } else {
                    res.redirect('/wrong-code')
                }
            } else {
                res.redirect('wrong-code')
            }
        } else {
            res.redirect('wrong-code')
        }
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/wrong-code', async (req, res) => {
    res.render('layouts/main', {
        body: 'wrong-code',
        user: req.user
    })
})

router.get('/password-updated', async (req, res) => {
    res.render('layouts/main', {
        body: 'password-updated',
        user: req.user
    })
})

module.exports = router