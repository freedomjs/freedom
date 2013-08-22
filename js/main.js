var magic_string = "/UWNetworksLab/freedom/wiki/";
var home_md = 'wiki/Home.md';
function rewriteLinks() {
  $('a').each(function() {
    if ($(this).attr('href').indexOf(magic_string) >= 0) {
      var link = $(this).attr('href');
      link = '#wiki/' + link.substr(link.indexOf(magic_string) + magic_string.length) + '.md';
      $(this).attr('href', link);
    }
  });
}

function Editor(preview) {
  this.update = function (url) {
    var xhr = new XMLHttpRequest();
    //xhr.addEventListener("progress", updateProgress, false);
    xhr.addEventListener("load", function(evt) {
          if (xhr.status == 200) {
            window.scrollTo(0,0);
            preview.innerHTML = markdown.toHTML(xhr.responseText);
            rewriteLinks();
          } else {
            editor.update(home_md);
          }
        }, false);
    xhr.addEventListener("error", function(evt) {
          console.log("Download failed");
          editor.update(home_md);
        }, false);
    xhr.addEventListener("abort", function(evt) {
          console.log("Download aborted");
          editor.update(home_md);
        }, false);
    xhr.open('get', url, true);
    xhr.send();
  };
  preview.editor = this;
}
var editor = new Editor(document.getElementById("markdown"));

$(window).bind('hashchange', function(e) {
  if (window.location.hash && window.location.hash.substr(0, 6) == '#wiki/') {
    var dest = window.location.hash.substr(1);
    dest = dest.replace("@[^a-zA-Z0-9.-_]", "");
    editor.update(dest);
  } else {
    editor.update(home_md);
  }
});
$(window).trigger('hashchange');

