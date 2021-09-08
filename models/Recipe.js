const mongoose = require('mongoose')
const RecipeSchema = new mongoose.Schema({
    images: {
        type: [String],
        required: true
    },
    prep: {
        type: String,
        required: true
    },
    cook: {
        type: String,
        required: true
    },
    ready: {
        type: String
    },
    servings: {
        type: String,
        required: true
    },
    yield: {
        type: String
    },
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    ingredients: {
        type: String
    },
    directions: {
        type: String,
        required: true
    },
    rateCount: {
        type: Number,
        default: 0
    },
    rateValue: {
        type: Number,
        default: 0
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

module.exports = mongoose.model('Recipe', RecipeSchema)