// After loading freedom.js, the window is populated with a 'freedom'
// object, which is used as a message passing channel to the root module
window.onload = function() {
  if (!window.FileReader) {
    document.body.innerHTML = "Your browser does not support HTML5 FileReader";
  }

  document.getElementById('closeModal').onclick = function() {
    $('#dropModal').modal('hide');
  };
    
  function fileError(e) {
    var errorMsg = 'An error occurred while reading this file';
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        errorMsg = 'File Not Found!';
        break;
      case evt.target.error.NOT_READABLE_ERR:
        errorMsg = 'File is not readable';
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
    }
    $('#dropMessage').text(errorMsg);
  }

  function fileLoad(evt) {
    $('#dropProgress').css('width' , "100%");
    console.log("READ DONE");
    window.freedom.emit('serve-data', evt.target.result);
  }

  function fileProgress(evt) {
    if (evt.lengthComputable) {
      var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
      if (percentLoaded < 100) {
        $('#dropProgress').css('width', percentLoaded + "%");
      }
    }
  }

  function handleFile(e) {
    e = e || window.event; // get window.event if e argument missing (in IE)   
    if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
    var dt = e.originalEvent.dataTransfer;
    var files = dt.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = fileLoad;
    reader.onerror = fileError;
    reader.onprogress = fileProgress;
    reader.onloadstart = function(evt) {
      //Get rid of the overlay
      within_dragenter = false;
      $("#drop").removeClass('overlaytext');
      //Show our drop modal
      $('#dropModal').modal({});
    };
    reader.readAsArrayBuffer(file);
    return false;
  }

  var within_dragenter = false;
  $(document.body).bind('dragenter', function(e) {
    if (e.preventDefault) { e.preventDefault(); }
    within_dragenter = true;
    setTimeout(function() {within_dragenter=false;},0);
    $("#drop").addClass('overlaytext');
  });
  $(document.body).bind('dragover', function(e) {
    if (e.preventDefault) { e.preventDefault(); }
  });
  $(document.body).bind('dragleave', function(e) {
    if (! within_dragenter) {
      $("#drop").removeClass('overlaytext');
    }
    within_dragenter = false;
  });
  $(document.body).bind('drop', handleFile);

  window.freedom.on('serve-url', function(val) {
    var displayUrl = window.location + "#" + JSON.stringify(val);
    var key = val.key;
    $("#dropMessage").text("Share the following URL with your friends. Don't be a jerk, keep this tab open while file transfer is happening");
    $("#dropUrl").val(displayUrl);
    //Create a new stat monitor
    $("#servingheader").show();
    var div = document.createElement('div');
    var input = document.createElement('input');
    input.className = 'input-xxlarge';
    input.type = 'text';
    input.readOnly = true;
    input.value = displayUrl;
    var stat = document.createElement('div');
    stat.id = val.key;
    div.appendChild(input);
    div.appendChild(stat);
    div.appendChild(document.createElement('br'));
    $("#stats").append(div);
  });

  window.freedom.on('serve-error', function(val) {
    $("#dropMessage").text(val);
  });

  window.freedom.on('download-progress', function(val) {
    //val is an integer with a percentage
    $('#dropModal').modal('show');
    $('#dropProgress').css('width' , val+"%");
  });
  
  window.freedom.on('download-data', function(val) {
    console.log("Download complete"); 
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder || window.MozBlobBuilder;
    window.URL = window.URL || window.webkitURL;
    var blob = new Blob([val]);
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.appendChild(document.createTextNode('Click here to download'));
    $("#dropMessageBox").append(link);
    $('#dropModal').modal('show');
    /**
    rfs = window.requestFileSystem || window.webkitRequestFileSystem;
    rfs(TEMPORARY, 1024 * 1024, function(fs) {
      fs.root.getFile('image.png', {create: true}, function(fileEntry) {
        fileEntry.createWriter(function(writer) {
          writer.onwrite = function(e) { };
          writer.onerror = function(e) { };
          var blob = new Blob([xhr.response], {type: 'image/png'});
          writer.write(blob);
        }, onError);
      }, onError);
    }, onError);
    **/
  });
  window.freedom.on('download-error', function(val) {
    $('#dropModal').modal('show');
    $("#dropMessage").text(val);
  });

  window.freedom.on('stats', function(val) {
    var elt = document.getElementById(val.key);
    while (elt.hasChildNodes()) {
      elt.removeChild(lastChild);
    }
    elt.appendChild(document.createElement('p').appendChild(document.createTextNode('Downloads in Progress: ' + val.inprogress)));
    elt.appendChild(document.createElement('br'));
    elt.appendChild(document.createElement('p').appendChild(document.createTextNode('Downloads Completed: ' + val.done)));
  });

  try {
    var hash = JSON.parse(window.location.hash.substr(1));
    freedom.emit('download', hash);
  } catch (e) {
    console.log("No parseable hash. Don't download");
  }
  $("#servingheader").hide();   
};

