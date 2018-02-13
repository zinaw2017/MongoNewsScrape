// Dependencies
var express = require("express");
var bodyParser = require("body-parser");

console.log("_____________________");

// Database ORM
var mongoose = require("mongoose");

// // Setting mongoose to leverage Promises
mongoose.Promise = Promise;

// Setting port
var port = process.env.PORT || 3000;

// Initialize express
var app = express();
// Use body-parser
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars
var exphbs = require("express-handlebars");
// Setting default view engine to handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Database configuration with mongoose on production or dev environment
if(process.env.MONGODB_URI) {
	console.log("Attempting to connect to MLAB");
 mongoose.connect("mongodb://<zinaw>:<123456>@ds233218.mlab.com:33218/mongewscrape/");

}else {
   mongoose.connect("mongodb://localhost/mongonewsscrape");
}
// Getting mongoose connection
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Requiring article-controller
require("./controllers/article-controller.js")(app);

// Listening on port
app.listen(port, function() {
	console.log("Listening on " + port);
});