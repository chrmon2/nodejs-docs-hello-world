const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    site: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    displayName: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    desc: {
        type: String,
        default: ""
    },
    image: {
        type: String
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const model = mongoose.model('User', UserSchema)