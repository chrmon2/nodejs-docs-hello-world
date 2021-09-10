const GoogleStrategy = require('passport-google-oauth20').Strategy
const TwitterStrategy = require('passport-twitter').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const LocalStrategy = require('passport-local').Strategy
/*const mongoose = require('mongoose')
const User = require('../models/User')
const bcrypt = require('bcrypt')*/


const passport = function(passport) {
    /*passport.use(
        new GoogleStrategy(
            {
                clientID: process.env["GOOGLE_CLIENT_ID"],
                clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
                callbackURL: process.env["ROOT_URL"] + 'auth/google/callback'
            },
            async (accessToken, refreshToken, profile, done) => {
                const newUser = {
                    site: 'google',
                    userID: profile.id,
                    displayName: profile.displayName,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    image: profile.photos[0].value
                }

                try {
                    let user = await User.findOne({
                        site: 'google',
                        userID: profile.id
                    })
                    if(user) {
                        done(null, user)
                    } else {
                        user = await User.create(newUser)
                        done(null, user)
                    }
                } catch(err) {
                    console.error(err)
                }
            }
        )
    )
    passport.use(
        new TwitterStrategy(
            {
                consumerKey: process.env["TWITTER_CONSUMER_KEY"],
                consumerSecret: process.env["TWITTER_CONSUMER_SECRET"],
                callbackURL: process.env["ROOT_URL"] + "auth/twitter/callback",
                includeEmail: true
            },
            async (accessToken, refreshToken, profile, done) => {
                console.log(profile)
                const newUser = {
                    site: 'twitter',
                    userID: profile.id,
                    displayName: profile.displayName,
                    firstName: profile.displayName,
                    lastName: null,
                    image: profile.profile_image_url
                }
    
                try {
                    let user = await User.findOne({
                        site: 'twitter',
                        userID: profile.id
                    })
                    if(user) {
                        done(null, user)
                    } else {
                        user = await User.create(newUser)
                        done(null, user)
                    }
                } catch(err) {
                    console.error(err)
                }
            }
        )
    )
    passport.use(
        new FacebookStrategy(
            {
                clientID: process.env["FB_CLIENT_ID"],
                clientSecret: process.env["FB_CLIENT_SECRET"],
                callbackURL: process.env["ROOT_URL"] + "auth/facebook/callback"
            },
            async (accessToken, refreshToken, profile, done) => {
                if(profile.firstName) {
                    var firstName = profile.firstName
                } else {
                    var firstName = profile.displayName
                }
                if(profile.profileUrl) {
                    var imageURL = profile.profileUrl
                } else {
                    var imageURL = "https://cdn.iconscout.com/icon/free/png-256/user-1648810-1401302.png"
                }
                const newUser = {
                    site: 'facebook',
                    userID: profile.id,
                    displayName: profile.displayName,
                    firstName: firstName,
                    lastName: profile.givenName,
                    image: imageURL
                }
    
                try {
                    let user = await User.findOne({
                        site: 'facebook',
                        userID: profile.id
                    })
                    if(user) {
                        done(null, user)
                    } else {
                        user = await User.create(newUser)
                        done(null, user)
                    }
                } catch(err) {
                    console.error(err)
                }
            }
        )
    );
    passport.use(
        new LocalStrategy(
            async(username, password, done) => {
                User.findOne({ userName: username }, function (err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done(null, false);
                    }
                    if (!bcrypt.compareSync(password, user.password)) {
                        return done(null, false);
                    }
                    return done(null, user)
                });
            }
        )
      );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    })
      
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => done(err, user))
    })*/
}

module.exports = passport