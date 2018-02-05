// Requiring mongoose
var mongoose = require("mongoose");
// Creating Schema 
var Schema = mongoose.Schema;

// Create Article schema
var ArticleSchema = new Schema({
  // Title 
  headline: {
    type: String,
    required: true,
    unique: true
  },
  // Link 
  summary: {
    type: String
  },
  // Link
  link: {
    type: String
  },
  // By-line
  byline: {
    type: String
  },
  // Flag to mark as saved
  saved_flag: {
    type: Boolean,
    default: false
  },
  // To save note ids as reference to each note
  notes: [{
    type: Schema.Types.ObjectId,
    ref: "Note"
  }]
});

// Create Article model with ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export Article model 
module.exports = Article;
