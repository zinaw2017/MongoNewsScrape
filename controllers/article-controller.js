// Requiring Article and Note models
var Article = require("../models/article.js");
var Note = require("../models/note.js");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Routes
//_____________________________

// Exporting routes
module.exports = function(app) {	

	// Primary route will hit when website loads
	app.get("/", function(req, res) {
		// Get all articles to display 
	  	promiseAllArticles().then(function(allArticlesData) {
	  		// Get saved articles to display count using flashy method with ES6 version of reduce()
	  		var savedArticleCount = allArticlesData.reduce((a, b) => {
	  			// If saved_flag, add 1 else 0
	  			return a + (b.saved_flag ? 1 : 0);
	  		},0);

			// Render index with received data
			res.render("index", 
			{articles: allArticlesData, articleCount: allArticlesData.length, savedCount: savedArticleCount});
	  		
		});
	});

	// Routing to scrape news 
	app.get("/scrape", function(req, res) {
		// Initialize promise array to hold all save entry queries
		var promiseArray = [];

		// First, we grab the body of the html with request
		request("https://www.nytimes.com/section/world?WT.nav=page&action=click&contentCollection=World&module=HPMiniNav&pgtype=Homepage&region=TopBar", function(error, response, html) {
		    // Then, we load that into cheerio and save it to $ for a shorthand selector
		    var $ = cheerio.load(html);
			
		    // Iterating over each required element
		    $("ol.story-menu>li>article>div.story-body>a.story-link").each(function(i, element) {
		    	// Capturing required properties of each element into variables
		    	var link = $(element).attr("href");

		    	var headline = $(element).children().find(".headline").html().trim();

		    	var summary = $(element).children().find(".summary").html().trim();

		    	var byline = $(element).children().find(".byline").html();

			    // Initialize result object
			    var result = {};

			    // Add the headline, link, summary and byline of each to result object
			    result.headline = headline;
			    result.link = link;
			    result.summary = summary;
			    result.byline = byline;

			    // Create an entry object of Article model
			    var entry = new Article(result);

			    // Pushing each entry save into an array to use promise
			    promiseArray.push(

				    // Saving the entry to Articles
				    entry.save(function(err, data) {
				        // Log any errors
				        if (err) {
				        	if(!err.message.includes("duplicate key error")) {
				          		console.log(err);
				        	}else {
				        		console.log("Duplicate entry detected");
				        	}
				        }
				        // Or log saved entry
				        else {
				    		console.log("Entry saved");
				        }
			      	})
				);
		    });

		    // Rendering partials after every entry is saved - using Promise for this
		    Promise.all(promiseArray).then(function() {
		    	// Execute promise function to fetch all articles
		    	promiseAllArticles().then(function(allArticlesData) {
		    		// Another less flashy ES6 way to 'filter' just the savedArticles from all
		    		var savedArticleCount = (allArticlesData.filter(article => article.saved_flag === true)).length;
		    		console.log(allArticlesData.length);
		  			// Render articles onto index page using articledata partial
		  			res.render("partials/articledata", 
		  			{articles: allArticlesData, layout: false, articleCount: allArticlesData.length, savedCount: savedArticleCount});
				});
		    });

		});
	});

	// Getting all saved articles from all articles
	app.get("/saved", function(req, res) {
		promiseAllArticles().then(function(allArticlesData) {
			// Using ES6 style filter to find only saved articles
			var savedArticles = allArticlesData.filter(article => article.saved_flag === true);
			// Render data to saved page
			res.render("saved", {saved: savedArticles, savedCount: savedArticles.length, articleCount: allArticlesData.length});
		});
	});


	// Update article saved_flag
	app.post("/save", function(req, res) {
		// Find required article and update saved_flag
		Article.findOneAndUpdate({"_id": req.body.id}, {$set: {saved_flag: true}},{new: true})
		.exec(function(err, data) {
			if(err) {
				console.log(err);
			}else {
				res.send(data);
			}
		});
	});

	// Undo save i.e. set saved_flag to false
	app.post("/unsave", function(req, res) {
		// Find the article with id and set saved_flag to false
		Article.findOneAndUpdate({"_id": req.body.id}, {$set: {saved_flag: false}},{new: true})
		.exec(function(err, data) {
			if(err) {
				res.send(err);
				console.log(err);
			}else {
				res.send(data);
			}
		});
	});

	// Get notes for requested article
	app.get("/note/article/:id", function(req, res) {
		// Find article with id and populate notes
		Article.findOne({ "_id": req.params.id })
	  	// function to populate notes
	  	.populate("notes")
	  	// execute callback
	  	.exec(function(error, data) {
		    // Log error
		    if (error) {
		    	res.send(error);
		      	console.log(error);
		    }
		    // Send data back as json
		    else {
		    	// console.log(data);
		      	res.json(data);
		    }
	  	});
	});

	// Add notes to article id
	app.post("/note/article/:id", function(req, res) {
		console.log("REQ.BODY");
		console.log(req.body);
	  // Create a new note and pass the req.body to the entry
	  var newNote = new Note(req.body);
	  console.log("SAVING NEW NOTE");
	  console.log(newNote);
	  // And save the new note the db
	  newNote.save(function(error, noteData) {
	    // Log any errors
	    if (error) {
	    	res.send(error);
	    	if(error.message.includes("Note validation failed")) {
	    		console.log("EMPTY NOTE WILL NOT BE SAVED");
	    	}else {
	    		console.log(error);
	    	}
	    }
	    // Otherwise
	    else {
	      // Use the article id to find and update it's note
	      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: {"notes": noteData._id }})
	      // Execute the above query
	      .exec(function(err, data) {
	        // Log any errors
	        if (err) {
	          res.send(err);
	          console.log(err);
	        }
	        else {
	          // Or send the document to the browser
	          res.send(data);
	        }
	      });
	    }
	  });
	});

	// Delete a note from note model and it's article reference
	app.post("/note/delete", function(req, res) {
		// Get articles with reference to that note and pop from array
		Article.findOneAndUpdate({"_id": req.body.articleId}, {$pull : {"notes": req.body.noteId}})
		.exec(function(err, data) {
			if(err) {
				console.log(err);
			}else {
				// Delete note with that id
				Note.findByIdAndRemove(req.body.noteId).exec(function(err, data) {
					if(err) {
						console.log(err);
					}else {
						res.send(data);
					}
				});
			}
		});
	});
};

// Function to return promise of finding all articles
function promiseAllArticles() {
	// Query to find all from Article 
	var query = Article.find();
	// Return promise
	return query.exec();
}