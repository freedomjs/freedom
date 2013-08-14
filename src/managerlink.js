if (typeof fdom === 'undefined') {
  fdom = {};
}

fdom.ManagerLink = function() {
  this.config = {};
};

fdom.ManagerLink.get = function() {
  if (!fdom.ManagerLink._managerlink) {
    fdom.ManagerLink._managerlink = new fdom.ManagerLink();
  }
  return fdom.ManagerLink._managerlink;
};

fdom.ManagerLink.prototype.start = function() {
  //console.log("Manager Link starting");
  var xhr = new XMLHttpRequest();
  xhr.onload = this.receiveScript.bind(this);
  xhr.open('get', 'http://127.0.0.1:9009/script', true);
  //xhr.send();
};

fdom.ManagerLink.prototype.receiveScript = function() {

};
