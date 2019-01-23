$(document).ready(function() {
    var count=0;

  $("#scrape").on("click", function(e){
    e.preventDefault();
    console.log("button clicked");
    $.ajax({
      method: "GET",
      url: "/scrape"
    }).then(function(){
      
      window.location.href = "/";
    })
  });
  $("#clean").on("click", function(e){
    e.preventDefault();
    console.log("button clicked");
    $.ajax({
      method: "GET",
      url: "/clean"
    }).then(function(){
      window.location.href = "/";
    })
  });

  // Whenever someone clicks a p tag
$(document).on("click", ".li-article", function(e) {
  // Empty the notes from the note section
  e.preventDefault();
 // $("#exampleModal").modal();
  console.log("count: "+count);
  count++;
  
  // // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      $("#currNotes").html("");
      // A button to submit a new note, with the id of the article saved to it
      $("#savenote").attr("data-id", data._id );

      // If there's a note in the article
      if (data.note) {
        
        for(var i=0; i<data.note.length; i++) {
          var li = $("<li>");
          li.append("<p><b>"+data.note[i].title+"</b><i data-id="+data.note[i]._id+" class='ml-1 far fa-trash-alt'></i></p>");
          li.append("<p>"+data.note[i].body+"</p>");
          $("#currNotes").append(li);
        }
      }
      $("#exampleModal").modal();

    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  console.log("this ID is "+thisId)

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      
      window.location.href = "/";
    });

});

  $(document).on("click", ".far", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
    console.log("this ID is "+thisId)

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "GET",
      url: "/note/" + thisId,
      
    })
      // With that done
      .then(function(data) {
        console.log(data);
        window.location.href = "/";
      });

  });


});
