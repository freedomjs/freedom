/*jslint sloppy:true*/
/*globals $,console,FileReader,Blob,freedom,saveAs*/
// After loading freedom.js, the window is populated with a 'freedom'
// object, which is used as a message passing channel to the root module

// Controls the modal on the screen
// by default, the dropDownload and dropUrl elements are hidden
var Modal = {
  open: function () {
    $('#dropModal').modal('show');
    $("#dropDownload").hide();
    $("#dropUrl").hide();
  },
  displayMessage: function (val) {
    $("#dropMessage").text(val);
  },
  displayProgress: function (val) {
    $('#dropProgress').css('width', val + "%");
  },
  displayUrl: function (val) {
    $("#dropUrl").show();
    $("#dropUrl").val(val);
    $("#dropUrl").click(function () {
      $(this).select();
    });
    $("#dropUrl").click();
  },
  displayDownload: function () {
    $("#dropDownload").show();
  },
  close: function () {
    $("#dropModal").modal('hide');
  }
};

// Controls file reads
var FileRead = {
  onError: function (evt) {
    var errorMsg = 'An error occurred while reading this file';
    switch (evt.target.error.code) {
    case evt.target.error.NOT_FOUND_ERR:
      errorMsg = 'File Not Found!';
      break;
    case evt.target.error.NOT_READABLE_ERR:
      errorMsg = 'File is not readable';
      break;
    case evt.target.error.ABORT_ERR:
      break; // noop
    }
    Modal.displayMessage(errorMsg);
  },
  onLoad: function (file, evt) {
    console.log("File Read Done");
    Modal.displayProgress(100);
    // Send data to be served. Expect a 'serve-url' response with our descriptor
    var key = Math.random().toString();
    FileRead.app.emit('serve-data', {
      key: key,
      value: evt.target.result,
      name: file.name
    });
  },
  onProgress: function (evt) {
    if (evt.lengthComputable) {
      var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
      if (percentLoaded < 100) {
        Modal.displayProgress(percentLoaded);
      }
    }
  }
};

function startServing(files) {
  var err = document.getElementById("error"),
    file,
    reader;
  err.textContent = "";
  if (files.length < 1) {
    console.error("No files found. Exiting");
    err.textContent = "Can't find files, brah. Something wrong?";
    return;
  }

  file = files[0];
  reader = new FileReader();
  console.log("Dropped a file. Let's start reading " + file);
  reader.onload = FileRead.onLoad.bind({}, file);
  reader.onerror = FileRead.onError;
  reader.onprogress = FileRead.onProgress;
  reader.onloadstart = function (evt) {
    //Get rid of the overlay
    console.log("Started reading file");
    Modal.open();
    Modal.displayMessage('Uploading');
  };
  reader.readAsArrayBuffer(file);
  return;
}

// Controls behavior of drag and drop to the screen
var DragNDrop = {
  within: false,
  onFile: function (e) {
    //console.log(e);
    e = e || window.event; // get window.event if e argument missing (in IE)   
    if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
    DragNDrop.within = false;
    $("#drop").removeClass('overlaytext');
    $("#fileChooser").hide();
    startServing(e.originalEvent.dataTransfer.files);
    return false;
  },
  onEnter: function (e) {
    if (e.preventDefault) { e.preventDefault(); }
    DragNDrop.within = true;
    setTimeout(function () {
      DragNDrop.within = false;
    }, 0);
    $("#drop").addClass('overlaytext');
  },
  onLeave: function (e) {
    if (!DragNDrop.within) {
      $("#drop").removeClass('overlaytext');
    }
    DragNDrop.within = false;
  },
  onOver: function (e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
  }
};

// Controls the stats on the main page
var Stats = {
  initialize: function (key, name, displayUrl) {
    $("#statsHeader").show();
    var div = document.createElement('div'),
      label = document.createElement('h5'),
      input = document.createElement('input'),
      stat = document.createElement('div');
    label.appendChild(document.createTextNode(name));
    input.className = 'input-xxlarge';
    input.type = 'text';
    input.readOnly = true;
    input.value = displayUrl;
    stat.id = key;
    div.appendChild(label);
    div.appendChild(input);
    div.appendChild(stat);
    div.appendChild(document.createElement('br'));
    $("#stats").append(div);
  },
  update: function (val) {
    var elt = document.getElementById(val.key);
    while (elt.hasChildNodes()) {
      elt.removeChild(elt.lastChild);
    }
    elt.appendChild(document.createElement('p').appendChild(document.createTextNode('Downloads in Progress: ' + val.inprogress)));
    elt.appendChild(document.createElement('br'));
    elt.appendChild(document.createElement('p').appendChild(document.createTextNode('Downloads Completed: ' + val.done)));
  }
};

function initialize(fileDrop) {
  FileRead.app = fileDrop;

  fileDrop.on('serve-descriptor', function (val) {
    var displayUrl = window.location + "#" + JSON.stringify(val);
    Modal.open();
    Modal.displayMessage("Share the following URL with your friends. Don't be a jerk, keep this tab open while file transfer is happening");
    Modal.displayUrl(displayUrl);

    Stats.initialize(val.key, val.name, displayUrl);
  });

  fileDrop.on('serve-error', function (val) {
    Modal.open();
    Modal.displayMessage(val);
  });

  fileDrop.on('download-progress', function (val) {
    //val is an integer with a percentage
    Modal.open();
    Modal.displayProgress(val);
  });
  
  fileDrop.on('download-data', function (val) {
    console.log("Download complete");
    Modal.open();
    var blob = new Blob([val]);
    Modal.displayMessage("Gotcha!");
    document.getElementById('dropDownload').onclick = function () {
      if (window.filedrop_name) {
        saveAs(blob, window.filedrop_name);
      } else {
        saveAs(blob, 'unnamed');
      }
    };
    Modal.displayDownload();
    //Modal.displayDownload(window.URL.createObjectURL(blob));
  });

  fileDrop.on('download-error', function (val) {
    Modal.open();
    Modal.displayMessage(val);
  });

  fileDrop.on('stats', Stats.update);

  // See if there's a hash with a descriptor we can download
  try {
    var hash = JSON.parse(window.location.hash.substr(1));
    Modal.open();
    Modal.displayMessage('Downloading');
    fileDrop.emit('download', hash);
    if (hash.name) {
      window.filedrop_name = hash.name;
    }
  } catch (e) {
    console.log("No parseable hash. Don't download");
  }
  // Hide the stats header at first
  $("#statsHeader").hide();
}

window.onload = function () {
  // Get HTML5 stuff
  window.URL = window.URL || window.webkitURL;
  
  // Check for support
  if (!window.FileReader) {
    document.body.innerHTML = "Your browser does not support HTML5 FileReader";
    return;
  } else if (!window.URL) {
    document.body.innerHTML = "Your browser does not support window.URL";
    return;
  } else if (!window.Blob) {
    document.body.innerHTML = "Your browser does not support Blobs";
    return;
  }

  // Setup the modal's close button
  document.getElementById('closeModal').onclick = function () {
    Modal.close();
  };

  // Setup file drag and drop
  $(document.body).bind('dragenter', DragNDrop.onEnter);
  $(document.body).bind('dragover', DragNDrop.onOver);
  $(document.body).bind('dragleave', DragNDrop.onLeave);
  $(document.body).bind('drop', DragNDrop.onFile);

  document.getElementById("fileChooserBtn").onclick = function () {
    $('#drop').hide();
    var files = document.getElementById("fileChooserInput").files;
    startServing(files);
  };

  // Start freedom.
  freedom('freedom-module.json').then(function (FileDrop) {
    initialize(new FileDrop());
  });
};
