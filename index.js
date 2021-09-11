const path = require('path')
const express = require('express')
const multer = require('multer')
const upload = multer();
const bodyParser = require('body-parser')
const https = require('https');
const dotenv = require('dotenv')
const morgan = require('morgan')
const ejs = require('ejs')
const passport = require('passport')
const session = require('express-session')
const connectDB = require('./config/db')
const moment = require('moment')
const methodOverride = require('method-override')
const http = require('http')

//HTTPS

const fs = require('fs');
const key = fs.readFileSync('key.pem');
const cert = fs.readFileSync('cert.pem');

// Load config
dotenv.config({
    path: 'web.config'
})

// Passport config
require('./config/passport')(passport)

connectDB()

//Init App
const app = express()

// App Local functions

app.locals.moment = require('moment');

// Logging
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// EJS
app.set('view engine', 'ejs');

//URL encoded

app.use(express.urlencoded({ extended: true }))

// badyparser
app.use(bodyParser.urlencoded({extended: false}));
//Method override
app.use(methodOverride('_method'))

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: 'auto'
    }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

//Static folder
app.use(express.static(path.join(__dirname, 'public')))

// Routes
/*app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/recipes', require('./routes/recipes'))

//404 Page
app.use(function(req,res){
    res.status(404).render('layouts/main', {
        body: 'error/404',
        user: req.user
    })
});*/

app.get('/', async (req, res) => {
    res.render('error/404', {
        body: 'ho'
    })
})

const server = http.createServer(app);

const port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);
