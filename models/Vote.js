const mongoose = require('mongoose')
const VoteSchema = new mongoose.Schema({
    rating: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rating'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Vote', VoteSchema)