const express = require('express')
const router = express.Router()
const multer = require('multer')
var sizeOf = require('image-size');
const { ensureAuth, ensureGuest } = require('../middleware/auth')
const https = require('https');

const User = require('../models/User')
const Recipe = require('../models/Recipe')
const Rating = require('../models/Rating')
const Vote = require('../models/Vote')
const { upload } = require('../middleware/multer')

// @desc     Show add page
// @route    GET /
router.get('/add', ensureAuth, (req, res) => {
    res.render('layouts/main', {
        body: 'recipes/add',
        user: req.user,
        imgTooSmall: false,
        noImages: false,
        nonImage: false
    })
})

// @desc     Process add form
// @route    POST /
router.post('/add', async (req, res) => {
    upload.array('images', 20)(req, res, (err) => {
        var nonImage = false;
        if(err) {
            if(err === 'Error: File not an image') {
                nonImage = true;
            }
        }
        try {
            var filePaths = []
            var imgTooSmall = false;
            Array.from(req.files).forEach(
                f => {
                    var dimensions = sizeOf(f.path);
                    if(dimensions.width < 960 || dimensions.height < 960) {
                        imgTooSmall = true;
                    }
                    filePaths.push(process.env.ROOT_URL + f.path.substring(7))
                }
            )
            if(!req.user) {
                var noUser = true;
            } else {
                var noUser = false;
            }
            if(filePaths.length == 0) {
                var noImages = true;
            } else {
                var noimages = false;
            }
            if(req.body.prep === "") {
                var noPrep = true;
            } else {
                var noPrep = false;
            }
            if(req.body.cook === "") {
                var noCook = true;
            } else {
                var noCook = false;
            }
            if(req.body.servings === "") {
                var noServings = true;
            } else {
                var noServings = false;
            }
            if(req.body.title === "") {
                var noTitle = true;
            } else {
                var noTitle = false;
            }
            if(req.body.desc === "") {
                var noDesc = true;
            } else {
                var noDesc = false;
            }
            if(req.body.ingredients === "") {
                var noIngredients = true;
            } else {
                var noIngredients = false;
            }
            if(req.body.directions === "") {
                var noDirections = true;
            } else {
                var noDirections = false;
            }
            if(imgTooSmall || noImages || nonImage || noUser || noPrep || noCook || noServings || noTitle || noDesc || noIngredients || noDirections) {
                res.render('layouts/main', {
                    body: 'recipes/add',
                    user: req.user,
                    imgTooSmall: imgTooSmall,
                    noImages: false,
                    nonImage: nonImage,
                    prep: req.body.prep,
                    cook: req.body.cook,
                    ready: req.body.ready,
                    servings: req.body.servings,
                    yield: req.body.yield,
                    title: req.body.title,
                    desc: req.body.desc,
                    ingredients: req.body.ingredients,
                    directions: req.body.directions
                })
            } else {
                const newRecipe = {
                    images: filePaths,
                    prep: req.body.prep,
                    cook: req.body.cook,
                    ready: req.body.ready,
                    servings: req.body.servings,
                    yield: req.body.yield,
                    title: req.body.title,
                    desc: req.body.desc,
                    ingredients: req.body.ingredients,
                    directions: req.body.directions,
                    user: req.user.id
                }
                var thisRecipe = Recipe.create(newRecipe)
                res.redirect(`/recipes/${thisRecipe._id}`);
            }
        } catch(err) {
            console.error(err)
            res.status(500).render('layouts/main', {
                body: 'error/500',
                user: req.user
            })
        }
    })
})


router.post('/helpful', async (req, res) => {
    try {
        if(req.user) {
            let vote = await Vote.findOne({
                rating: req.body.review,
                user: req.user.id
            })
            if(vote) {
                var alreadyVoted = true;
            } else {
                var alreadyVoted = false;
            }
            if(!alreadyVoted) {
                const newVote = {
                    rating: req.body.review,
                    user: req.user.id
                }
                Vote.create(newVote)
                Rating.findOneAndUpdate({_id: req.body.review}, { $inc: {'helpfulCount': 1}},
                function( error, result){
                })
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

// @desc    Show single recipe
// @route   GET /recipes/:id
router.get('/:id', async (req, res) => {
    try{
        let recipe = await Recipe.findById(req.params.id)
            .populate('user')
            .lean()
        
        if(!recipe) {
            return res.render('layouts/main', {
                body: 'recipes/add',
                user: req.user
            })
        }

        var userRating = ""
        if(req.user) {
            userRating = await Rating.findOne({
                user: req.user._id,
                recipe: recipe._id
            })

            if(userRating) {
                var hasRating = true
            } else {
                var hasRating = false
            }
        } else {
            var hasRating = false
        }

        let reviews = await Rating.find({
            recipe: recipe,
            review: { $exists: true, $nin: [""] }
        })

        var voted = []

        for(var i = 0; i < reviews.length; i++) {
            if(req.user) {
                let vote = await Vote.findOne({
                    rating: reviews[i],
                    user: req.user
                })
                if(vote) {
                    voted.push(true)
                } else {
                    voted.push(false)
                }
            } else {
                voted.push(false)
            }
        }

        let images = await Rating.find({
            recipe: recipe,
            image: { $exists: true, $nin: [""] }
        })

        let revUsers = await User.find()

        res.render('layouts/main', {
            body: 'recipes/show',
            recipe,
            reviews,
            voted,
            images,
            revUsers, 
            showRating: false,
            imgTooSmall: false,
            nonImage: false,
            user: req.user,
            hasRating,
            userRating
        })
    } catch(err) {
        console.error(err)
        res.status(500).render('layouts/main', {
            body: 'error/500',
            user: req.user
        })
    }
})

router.get('/edit/:id', async (req, res) => {
    let recipe = await Recipe.findById(req.params.id)
        .populate('user')
        .lean()
    res.render('layouts/main', {
        body: 'recipes/edit',
        user: req.user,
        recipe,
        imgTooSmall: false,
        noImages: false,
        nonImage: false
    })
})

router.post('/:id', async (req, res) => {
    let recipe = await Recipe.findById(req.params.id)
        .populate('user')
        .lean()
    if(req.user && recipe) {
        let reviews = await Rating.find({
            recipe: recipe,
            review: { $exists: true, $nin: [""] }
        })

        let revUsers = await User.find()

        let rating = await Rating.findOne({
            user: req.user._id,
            recipe: recipe._id
        })
        if(!rating) {
            upload.single('image')(req, res, (err) => {
                var nonImage = false;
                if(err) {
                    if(err === 'Error: File not an image') {
                        nonImage = true;
                    }
                }
                try {
                    if(req.file) {
                        var filePath = process.env.ROOT_URL + req.file.path.substring(7)
                        var dimensions = sizeOf(req.file.path);
                        if(dimensions.width < 960 || dimensions.height < 960) {
                            var imgTooSmall = true;
                        } else {
                            var imgTooSmall = false;
                        }
                    } else {
                        var filePath = ""
                    }

                    var noRating = false;
                    if(!req.body.rating_value || !(["1","2","3","4","5"].indexOf(req.body.rating_value) > -1)) {
                        noRating = true;
                    }
                    
                    if(imgTooSmall || nonImage || noRating) {                
                        if(!recipe) {
                            return res.render('layouts/main', {
                                body: 'recipes/add',
                                user: req.user
                            })
                        }

                        var userRating = ""
                        if(req.user) {
                            userRating = Rating.findOne({
                                user: req.user._id,
                                recipe: recipe._id
                            })
                
                            if(userRating) {
                                var hasRating = true
                            } else {
                                var hasRating = false
                            }
                        } else {
                            var hasRating = false
                        }

                        res.render('layouts/main', {
                            body: 'recipes/show',
                            recipe,
                            showRating: true,
                            imgTooSmall: imgTooSmall,
                            nonImage: nonImage,
                            user: req.user,
                            hasRating,
                            userRating
                        })
                    } else {
                        const newRating = {
                            image: filePath,
                            rating: req.body.rating_value,
                            review: req.body.review,
                            user: req.user.id,
                            recipe: req.params.id
                        }
                        Rating.create(newRating)
                        Recipe.findOneAndUpdate({_id: req.params.id}, { $inc: {'rateCount': 1, 'rateValue': req.body.rating_value}},
                        function( error, result){
                        })
                        res.redirect(`${req.params.id}`);
                    }
                } catch(err) {
                    console.error(err)
                }
            })
        } else {
            upload.single('image')(req, res, (err) => {
                var nonImage = false;
                if(err) {
                    if(err === 'Error: File not an image') {
                        nonImage = true;
                    }
                }
                try {
                    if(req.file) {
                        var filePath = process.env.ROOT_URL + req.file.path.substring(7)
                        var dimensions = sizeOf(req.file.path);
                        if(dimensions.width < 960 || dimensions.height < 960) {
                            var imgTooSmall = true;
                        } else {
                            var imgTooSmall = false;
                        }
                    } else {
                        if(req.body.keep_image === "true") {
                            var filePath = rating.image
                        } else {
                            var filePath = ""
                        }
                    }

                    var noRating = false;
                    if(!req.body.rating_value || !(["1","2","3","4","5"].indexOf(req.body.rating_value) > -1)) {
                        noRating = true;
                    }
                    
                    if(imgTooSmall || nonImage || noRating) {                
                        if(!recipe) {
                            return res.render('layouts/main', {
                                body: 'recipes/add',
                                user: req.user
                            })
                        }

                        var userRating = ""
                        if(req.user) {
                            userRating = Rating.findOne({
                                user: req.user._id,
                                recipe: recipe._id
                            })
                
                            if(userRating) {
                                var hasRating = true
                            } else {
                                var hasRating = false
                            }
                        } else {
                            var hasRating = false
                        }

                        res.render('layouts/main', {
                            body: 'recipes/show',
                            recipe,
                            showRating: true,
                            imgTooSmall: imgTooSmall,
                            nonImage: nonImage,
                            user: req.user,
                            hasRating,
                            userRating
                        })
                    } else {
                        const newRating = {
                            image: filePath,
                            rating: req.body.rating_value,
                            review: req.body.review,
                            user: req.user.id,
                            recipe: req.params.id
                        }
                        Rating.findOneAndUpdate({
                            user: req.user._id,
                            recipe: recipe._id
                        }, {
                            $set: {
                                'image': filePath,
                                'rating': req.body.rating_value,
                                'review': req.body.review,
                                'user': req.user.id,
                                'recipe': req.params.id
                            }
                        },
                        function( error, result){
                        })
                        Recipe.findOneAndUpdate({_id: req.params.id}, { $inc: {'rateValue': req.body.rating_value - rating.rating}},
                        function( error, result){
                        })
                        res.redirect(`${req.params.id}`);
                    }
                } catch(err) {
                    console.error(err)
                }
            })
        }
    } else {
        res.render('layouts/main', {
            body: 'index',
            user: req.user,
            recipe
        })
    }
})

router.put('/edit/:id', async (req, res) => {
    let recipe = await Recipe.findById(req.params.id)
            .populate('user')
            .lean()
    upload.array('images', 20)(req, res, (err) => {
        var nonImage = false;
        if(err) {
            if(err === 'Error: File not an image') {
                nonImage = true;
            }
        }
        try {
            var filePaths = []
            var imgTooSmall = false;
            Array.from(req.files).forEach(
                f => {
                    var dimensions = sizeOf(f.path);
                    if(dimensions.width < 960 || dimensions.height < 960) {
                        imgTooSmall = true;
                    }
                    filePaths.push(process.env.ROOT_URL + f.path.substring(7))
                }
            )
            if(!req.user) {
                var noUser = true;
            } else {
                var noUser = false;
            }
            if(filePaths.length == 0) {
                var noImages = true;
            } else {
                var noimages = false;
            }
            if(req.body.prep === "") {
                var noPrep = true;
            } else {
                var noPrep = false;
            }
            if(req.body.cook === "") {
                var noCook = true;
            } else {
                var noCook = false;
            }
            if(req.body.servings === "") {
                var noServings = true;
            } else {
                var noServings = false;
            }
            if(req.body.title === "") {
                var noTitle = true;
            } else {
                var noTitle = false;
            }
            if(req.body.desc === "") {
                var noDesc = true;
            } else {
                var noDesc = false;
            }
            if(req.body.ingredients === "") {
                var noIngredients = true;
            } else {
                var noIngredients = false;
            }
            if(req.body.directions === "") {
                var noDirections = true;
            } else {
                var noDirections = false;
            }
            if(imgTooSmall || nonImage || noUser || noPrep || noCook || noServings || noTitle || noDesc || noIngredients || noDirections) {
                console.log(imgTooSmall || nonImage || noUser || noPrep || noCook || noServings || noTitle || noDesc || noIngredients || noDirections)
                res.render('layouts/main', {
                    body: 'recipes/edit',
                    recipe,
                    user: req.user,
                    imgTooSmall: imgTooSmall,
                    noImages: false,
                    nonImage: nonImage,
                    prep: req.body.prep,
                    cook: req.body.cook,
                    ready: req.body.ready,
                    servings: req.body.servings,
                    yield: req.body.yield,
                    title: req.body.title,
                    desc: req.body.desc,
                    ingredients: req.body.ingredients,
                    directions: req.body.directions
                })
            } else {
                if(noImages) {
                    var images = recipe.images
                } else {
                    var images = filePaths
                }
                const newRecipe = {
                    images: images,
                    prep: req.body.prep,
                    cook: req.body.cook,
                    ready: req.body.ready,
                    servings: req.body.servings,
                    yield: req.body.yield,
                    title: req.body.title,
                    desc: req.body.desc,
                    ingredients: req.body.ingredients,
                    directions: req.body.directions,
                    user: req.user.id
                }
                Recipe.findOneAndUpdate({_id: req.params.id}, { $set: newRecipe},
                function( error, result){
                })
                res.redirect(`/recipes/${req.params.id}`);
            }
        } catch(err) {
            console.error(err)
            res.status(500).render('layouts/main', {
                body: 'error/500',
                user: req.user
            })
        }
    })
})

module.exports = router;