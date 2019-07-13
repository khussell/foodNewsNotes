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

var PORT = 3030;



//middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/newsNotes", { useNewUrlParser: true });

// Routes

app.get("/scrape", function(req, res) {
    db.Article.deleteMany({}).then(function(data){
        res.send("removed")
    }).then(function(){
    axios.get("https://www.delish.com/food-news/").then(function(response){
        var $ = cheerio.load(response.data)
       
        $(".full-item").each(function(i, element){

             var result = {}

             result.a = "https://www.delish.com/food-news"+ $(this).children("a").attr("href")
             result.image= $(this).children(".full-item-image").children(".lazyimage").data("src")
             result.title = $(this).children(".full-item-content").children("a").text()
             result.summary = $(this).children(".full-item-content").children(".full-item-dek").children("p").text()
             result.saved = false

             db.Article.create(result)
             .then(function(dbArticle) {
               console.log(dbArticle)
             })
             .catch(function(err) {
               // If an error occurred, log it
               console.log(err);
             });
        })
       
    
    })
    })
})

app.get("/articles", function(req,res){
    db.Article.find({}).then(function(dbArticle){
        res.json(dbArticle)
    })
})

app.post("/savedArticles", function(req,res){
    var id = req.body.id
    
    db.Article.findOneAndUpdate({_id: id}, {$set: {saved: true}}).then(function(dbArticle){
        res.json(dbArticle)
    }).catch(function(error){
        console.log(error)
      })
})


app.get("/", function(req,res){
    db.Article.find({}).then(function(dbArticle){
        console.log(dbArticle)
        res.render("index")
    })
    
})


app.get("/saved", function(req, res){
    db.Article.find({saved: true}).then(function(dbArticle){
        console.log(dbArticle)
        res.render("saved", {articles: dbArticle})
    })
})

app.post("/deletedArticle", function(req,res){
    var id = req.body.id
    db.Article.findOneAndUpdate({_id:id}, {$set: {saved: false}}).then(function(dbArticle){
        res.json(dbArticle)
    })
})


app.post("/note", function(req,res){
    var title = req.body.title
    var id = req.body.id
    var entry = req.body.entry
    db.Note.create({entry: entry}).then(function(dbNote){
        return db.Article.findOneAndUpdate({_id:id}, { $push: { notes: dbNote._id } }).then(function(dbArticle){
            res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
        
    })
})

app.get("/notes/:id", function(req,res){
    db.Article.find({_id: req.params.id}).populate("notes").then(function(dbArticle){
        res.json(dbArticle)
    })
})


    // Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });