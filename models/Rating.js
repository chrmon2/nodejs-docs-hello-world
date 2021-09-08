const mongoose = require('mongoose')
const RatingSchema = new mongoose.Schema({
    image: {
        type: String
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {validator: Number.isInteger}
    },
    review: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Rating', RatingSchema)