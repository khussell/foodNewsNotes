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

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
    axios.get("https://www.delish.com/food-news/").then(function(response){
        var $ = cheerio.load(response.data)

        $(".full-item").each(function(i, element){

             var result = {}

             result.a = "https://www.delish.com/food-news"+ $(this).children("a").attr("href")
             result.image= $(this).children(".full-item-image").children(".lazyimage").data("src")
             result.title = $(this).children(".full-item-content").children("a").text()
             result.summary = $(this).children(".full-item-content").children(".full-item-dek").children("p").text()

             db.Article.create(result)
             .then(function(dbArticle) {
               // View the added result in the console
               console.log(dbArticle);
             })
             .catch(function(err) {
               // If an error occurred, log it
               console.log(err);
             });
        })
        console.log(results)
    })
})


app.get("/", function(req,res){
    db.Article.find({}).then(function(dbArticle){
        console.log(dbArticle)
        res.render("index", {articles: dbArticle})
    })
    
})




























    // Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });