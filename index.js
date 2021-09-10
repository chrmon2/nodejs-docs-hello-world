
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

const server = http.createServer((request, response) => {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("Hello World!" + process.env.GOOGLE_CLIENT_ID + "so");
});

const port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);
