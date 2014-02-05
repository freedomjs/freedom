(function() {
  window.jasmine = jasmineRequire.core(jasmineRequire)
  jasmineRequire.html(jasmine);
  var jasmineEnv = jasmine.getEnv({global: window});
  jasmineEnv.updateInterval = 1000;

  var htmlReporter = new jasmine.HtmlReporter();
  jasmineEnv.addReporter(htmlReporter);

  jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };

  var currentWindowOnload = window.onload;

  window.onload = function() {
    if (currentWindowOnload) {
      currentWindowOnload();
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if (xhr.readyState==4 && xhr.status==200){
        window.freedom_src = xhr.responseText;
        execJasmine();        
      }
    }
    xhr.open("get", "/freedom.js", true);
    xhr.overrideMimeType("text/javascript; charset=utf-8");
    xhr.send(null);
  };

  function execJasmine() {
    htmlReporter.initialize();
    jasmineEnv.execute();
  }

})();
