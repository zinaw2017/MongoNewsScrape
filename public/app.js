var articleCount;
var savedCount;

var scrapedArticleCount;

articleCount = $("span.home").html();

// Scrape articles and populate on click of button
$("#scrapeArticles").on("click", function() {
	// Get /scrape route
	$.get({
		url: "/scrape"

	}).done(function(data) {
		// Display rendered articledata handlebars in articlesDiv
		$("#articlesDiv").html(data);
		// Calculate scrapedArticleCount
		scrapedArticleCount = Math.abs(parseInt($("#articleCountInfo").val()) - parseInt(articleCount));
		$("#scrapedArticleCount").html(scrapedArticleCount);
		$("span.home").html($("#articleCountInfo").val());
		// Display modal
		$("#scrapeDoneNotificationModal").modal("show");

	}).fail(function(error) {
		// Log error
		console.log("Scrape unsuccessful, error ->");
		console.log(error);
	});
});

// On clicking 'Add to Saved' button
$("#articlesDiv").on("click", ".saveArticle", function() {
	var articleId = $(this).attr("data-id");
	// Get saved article count
	savedCount = $("span.saved").html();
	// Getting current button, to work with within ajax done
	var saveButton = $(this);
	// Disable save button
	saveButton.prop('disabled', true);

	// Post request to mark article as saved
	$.post({
		url: "/save",
		data: {id: articleId}

	}).done(function(data) {
		// Increment saved count and set badge in menubar
		savedCount++;
		$("span.saved").html(savedCount);

		// Hide save button and mark as saved
		saveButton.parent().append("<i style='color: #57c65c;' class='fa fa-3x fa-check' aria-hidden='true'></i>");
		saveButton.hide();

	}).fail(function(error) {
		// Log error
		console.log("Could not add to saved, error ->");
		console.log(error);
		// Re-enable save button to try saving again
		saveButton.prop('disabled', false);
	});
});

$(".savedArticle").on("click", ".undoSaveArticle", function() {
	var articleId = $(this).attr("data-id");
	// Getting current button, to work with within ajax done
	var unsaveButton = $(this);
	// Disable unsave button
	unsaveButton.prop('disabled', true);
	// Post to mark article as unsaved
	$.post({
		url: "/unsave",
		data: {id: articleId}

	}).done(function(data) {
		// Get saved article count and decrement
		savedCount = $("span.saved").html();
		savedCount--;
		// Set updated saved count
		$("span.saved").html(savedCount);
		// Remove article from saved articles display
		unsaveButton.parent().parent().parent().remove();
	}).fail(function(error) {
		// Log error
		console.log("Could not remove from saved, error ->");
		console.log(error);
		// Re-enable save button to try saving again
		unsaveButton.prop('disabled', false);
	});
});

// Add note code
$(".savedArticle").on("click", ".addNote", function() {
	var articleId = $(this).attr("data-id");

	// Get notes for this article
	$.get({
		url: "/note/article/" + articleId

	}).done(function(data) {
		$("#addNotesModal #saveNote").html("Save Note");
		$("#addNotesModal #saveNote").attr("data-dismiss", "");
		// Remove any error messages from previous tries here
		$("div.alert-danger").remove();
		// Remove error-input on input tag
		$("#addNotesModal #newNote").removeClass("remove-default").removeClass("error-input");
		// Empty note div before creating new notes within
		$("#savedNotesDiv").empty();

		// Iterate through each note in data and create divs within savedNotesDiv
		data.notes.forEach(function(noteItem) {
			var noteDiv = $("<div class='noteItem'>");
			noteDiv.html("<div class='col-xs-11'>" + noteItem.text + "</div>");
			noteDiv.append("<button data-id='" + noteItem._id + "' class='col-sm-1 btn btn-danger btn-xs deleteNote'><i class='fa fa-times' aria-hidden='true'></i></button>");
			$("#savedNotesDiv").append(noteDiv);
		});

		// Setting data-id attribute of Save Note button with current articleId 
		$("#saveNote").attr("data-id", articleId);
		// Show notes modal
		$("#addNotesModal").modal("show");
	}).fail(function(error) {
		console.log(error);
	});
});

$("#saveNote").on("click", function(event) {
	var articleId = $(this).attr("data-id");
	// Get note content
	var noteContent = $("#newNote").val();
	// Post new note 
	$.post({
		url: "/note/article/" + articleId,
		data: { text: noteContent }
	}).done(function(data) {
		// If save note has error, show alert, change 'Save Note' to 'Ok' and allow modal dismiss
		if(data.errors) {
			$("#addNotesModal #newNote").addClass("remove-default").addClass("error-input");
			$("#addNotesModal .modal-body").prepend("<div class='text-center alert alert-danger'>Article note cannot be empty.</div>");
			$("#addNotesModal #saveNote").attr("data-dismiss", "modal");
			$("#addNotesModal #saveNote").html("Ok");
		}else {
			// If no errors, dismiss modal and clear textbox
			$("#addNotesModal").modal("hide");
			$("#newNote").val("");
		}
	}).fail(function(error) { 
		console.log("Note could not be saved.");
		console.log(error);
	})
});

$("#savedNotesDiv").on("click", ".deleteNote", function() {
	var noteId = $(this).attr("data-id");
	var articleId = $("#saveNote").attr("data-id");
	// Find the noteDiv to remove after post
	var noteToDelete = $(this).parent();
	// Post new note 
	$.post({
		url: "/note/delete",
		data: { 
			noteId: noteId,
			articleId: articleId
		}
		
	}).done(function(data) {
		console.log(data);
		// Remove note from savedNotesDiv
		noteToDelete.remove();

	}).fail(function(error) { 
		console.log("Note could not be saved.");
		console.log(error);
	})
});

