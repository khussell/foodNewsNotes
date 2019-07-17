var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var app = express()

app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main"
    })
);
app.set("view engine", "handlebars");

// Stuff for scraping
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3030;

//Heroku
mongoose.Promise = global.Promise
mongoose.connect(
    process.env.MONGODB_URI || "mongodb://khussell:flamingo3@ds221258.mlab.com:21258/heroku_llp017qz",
    {
        useNewUrlParser: true
    }
)
    ;



//middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
//mongoose.connect("mongodb://localhost/newsNotes", { useNewUrlParser: true });



// Routes


//when url ends in /scrape, delete everything in database and axios will scrape delish.com for news article info
app.get("/scrape", function (req, res) {
    db.Article.deleteMany({}).then(function (data) {
        res.send("removed")
        
    }).then(function () {
        axios.get("https://www.delish.com/food-news/").then(function (response) {
            var $ = cheerio.load(response.data)


            //for each item on delish.com that has class full item we will store it's child info into an object result
            $(".full-item").each(function (i, element) {

                var result = {}

                result.a = "https://www.delish.com/food-news" + $(this).children("a").attr("href")
                result.image = $(this).children(".full-item-image").children(".lazyimage").data("src")
                result.title = $(this).children(".full-item-content").children("a").text()
                result.summary = $(this).children(".full-item-content").children(".full-item-dek").children("p").text()
                result.saved = false


                //putting result into database
                db.Article.create(result)
                    .then(function (dbArticle) {
                        console.log(dbArticle)
                    })
                    .catch(function (err) {
                        // If an error occurred, log it
                        console.log(err);
                    });


            })
        })
        
    })
})

//when user goes to /articles we will get all data from database collection Article and send to front end
app.get("/articles", function (req, res) {
    db.Article.find({}).then(function (dbArticle) {
        res.json(dbArticle)
    })
})


//when POST goes to savedArticles we will find the id of the article and change it's saved property to true
app.post("/savedArticles", function (req, res) {
    var id = req.body.id

    db.Article.findOneAndUpdate({ _id: id }, { $set: { saved: true } }).then(function (dbArticle) {
        res.json(dbArticle)
    }).catch(function (error) {
        console.log(error)
    })
})


//on main page we will find all info in database collection article and render index.handlebars, this actually isnt where we get data from
//data is actually taken in this instance from the button click see articles which will do a get to /articles
app.get("/", function (req, res) {
    db.Article.find({}).then(function (dbArticle) {
        console.log(dbArticle)
        res.render("index")
    })

})


//when taken to /saved page we will get all articles from database that have saved : true 
//we then will send this info as an object along with rendering saved.handlebars
app.get("/saved", function (req, res) {
    db.Article.find({ saved: true }).then(function (dbArticle) {
        console.log(dbArticle)
        res.render("saved", { articles: dbArticle })
    })
})

//when POST recieved with id, the property saved of that article will be changed to false
app.post("/deletedArticle", function (req, res) {
    var id = req.body.id
    db.Article.findOneAndUpdate({ _id: id }, { $set: { saved: false } }).then(function (dbArticle) {
        res.json(dbArticle)
    })
})


//when POST is recieved, we will create an entry in db Note collection, with the id that was sent with the post we are able 
//to then return Article.findOneAndUpdate with that id and push the notes id into the article.notes array
app.post("/note", function (req, res) {
    var title = req.body.title
    var id = req.body.id
    var entry = req.body.entry
    db.Note.create({ entry: entry }).then(function (dbNote) {
        return db.Article.findOneAndUpdate({ _id: id }, { $push: { notes: dbNote._id } }).then(function (dbArticle) {
            res.json(dbArticle);
        })
            .catch(function (err) {
                // If an error occurs, send it back to the client
                res.json(err);
            });

    })
})


//populating Article with the notes based on its id and the notes ids in the notes array 
//this is done when front end make note for article button is pressed 
app.get("/notes/:id", function (req, res) {
    db.Article.find({ _id: req.params.id }).populate("notes").then(function (dbArticle) {
        res.json(dbArticle)
    })
})

//note id is sent to be deleted
app.delete("/deleteNote", function (req, res) {
    var id = req.body.id
    db.Note.deleteOne({ _id: id }).then(function (dbNote) {
        res.json(dbNote)
    })
})


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});