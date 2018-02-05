// Requiring mongoose
var mongoose = require("mongoose");
// Creating schema class
var Schema = mongoose.Schema;

// Creating the Note schema
var NoteSchema = new Schema({
  text: {
    type: String,
    required: true
  }
});

// Creating Note model with NoteSchema
var Note = mongoose.model("Note", NoteSchema);

// Export Note model
module.exports = Note;
