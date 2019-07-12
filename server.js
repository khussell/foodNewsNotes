var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Stuff for scraping
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3030;

// Initialize Express
var app = express();

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
}




























    // Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });