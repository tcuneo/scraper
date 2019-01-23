var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT ||5000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
// Handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");


var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraper";


// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes


app.get("/", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find().sort({_id:1})
    .then(function(dbArticle) {
      res.render("index",{dbArticle: dbArticle});
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.nytimes.com/section/world").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    var counter=0;
    // Now, we grab every h2 within an article tag, and do the following:
    $("div.story-body").each(function(i, element) {
      // Save an empty result object
      var result = {};

      var link = $(element).find("a").attr("href");
			var title = $(element).find("h2.headline").text().trim();
			var summary = $(element).find("p.summary").text().trim();
			var img = $(element).parent().find("figure.media").find("img").attr("src");


      if(!(link === undefined)) {
        if(img === undefined) {
          img="http://placehold.jp/100x100.png";
        }
        result = {
          title: title,
          link: link,
          summary: summary,
          img: img
        };
       
        db.Article.findOne({ title: title })
        .then(function(dbArticle) {
          if(dbArticle) {
              console.log("article found");
          } else {
           
            db.Article.create(result)
              .then(function(dbArticle) {
                
              })
              .catch(function(err) {
                // If an error occurred, log it
                console.log(err);
              });
          }

          
          
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
       
      }

      
    });
    
    // Send a message to the client
    res.json(counter);
  });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {

  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      console.log(dbArticle);
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/note/:id", function(req, res) {

  db.Note.findByIdAndRemove(req.params.id, (err, dbNote) => {
    // As always, handle any potential errors:
    if (err) return res.status(500).send(err);
    // We'll create a simple object to send back with a message and the id of the document that was removed
    // You can really do this however you want, though.
    const response = {
        message: "Note successfully deleted",
        id: dbNote._id
    };
    return res.status(200).send(response);
});

});

app.get("/clean", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Note.remove({})
    .then(function(dbArticle) {
      db.Article.remove({})
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.redirect("/");
    })
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  console.log("note is");
  console.log(req.params.id);
  db.Note.create(req.body)
    .then(function(dbNote) {
      console.log("db note");
      console.log(dbNote);
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push:{ note: dbNote._id } }, { new: true });

    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      console.log("line 164");
      console.log(dbArticle);
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});