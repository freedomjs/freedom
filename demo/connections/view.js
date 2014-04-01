var base = 'http://www.freedomjs.org/?user=';
var colors = [
    '#041022', '#111d2f',
    '#05080d', '#031419',
    '#070524', '#091321',
    '#163038', '#0f093e',
    '#051010', '#041124',
    '#171929', '#0c1d36',
    '#011722', '#061233',
    '#050d1a', '#0e2b2e',
    '#040f21', '#0e2240',
    '#0d142a', '#051c24'
];

var container;
var stage;
var nodes = {};
var uqueue = [];

window.addEventListener('load', function () {
  document.body.className = 'loaded';
  container = document.getElementById('loading');
}, false);

window.addEventListener('message', function (msg) {
  if (msg.data.event === 'status' && msg.data.online === true) {
    document.body.className = 'online';
    setupStage();
  } else if (msg.data.event === 'status') {
    document.body.className = 'okay';
    container.innerHTML = '<div class="striped">' +
      (msg.data.online || 'Connecting') + '</div>';
  } else if (msg.data.event === 'user') {
    updateUsers(msg.data.users);
  } else {
    console.warn('ignored ' + msg.data.event);
  }
}, false);

var setupStage = function () {
  container.innerHTML = '';
  var cb = typeof stage === 'function' ? stage : function() {};
  stage = Sprite3D.stage(container);
  
  // Background.
  var panels = [];
  for (var i = 0; i < 20; i++) {
    var sprite = Sprite3D.create(".panel").x(i * 70);
    panels.push(sprite);
    stage.appendChild(sprite);
    sprite.update();
  }
  setInterval(permute.bind({}, panels), 2000);
  cb();
};

var permute = function (panels) {
  var first = Math.floor(Math.random() * panels.length);
  var second = Math.floor(Math.random() * panels.length);
  var out = panels[first];
  panels[first] = panels[second];
  panels[second] = out;
  for (var i = 0; i < panels.length; i++) {
    panels[i].css(
			"Transition",
			"all "+(1+2*Math.random())+"s ease-in-out",
			true
		).x(i * 70)
        .css('width', Math.random() * 150 + 'px')
        .css('background', colors[Math.floor(Math.random() * 20)])
        .rotationY(Math.random()*160 - 80)
        .rotationZ(Math.random()*10 - 5)
        .update();
  }
};

var updateUsers = function (users) {
  if (!stage || typeof stage === 'function') {
    stage = updateUsers.bind({}, users);
    return;
  }
  for (var user in users) {
    if (users.hasOwnProperty(user) && !nodes[user]) {
      enter(user, users[user]);
    }
  }
  for (var node in nodes) {
    if (nodes.hasOwnProperty(node) && !users[node]) {
      nodes[node].exit();
    }
  }
  for (var i in nodes) {
    if (nodes.hasOwnProperty(i)) {
      nodes[i].layout().update();
    }
  }
};

var User = function (name) {
  this.name = name;
  this.phase = 'entered';
  this.image = qr.toDataURL({
    value: base + name,
    background: 'rgba(255,0,0,0)'
  });
  this.el = Sprite3D.create('.node');
  var mask = Sprite3D.create('.mask');
  mask.css('background-image', 'url(' + this.image + ')');
  this.el.appendChild(mask);
  this.layout().scaleX(0).scaleY(0).update();
  stage.appendChild(this.el);
  uqueue.push(this);
  this.phase = 'entry';
  setTimeout(function() {
    this.phase = 'entered';
    this.layout().update();
  }.bind(this), 0);
};

User.prototype.layout = function () {
  if (this.phase !== 'entered') {
    return this.el;
  }
  var idx = uqueue.indexOf(this);
  var num = uqueue.length;
  var x, xStep, y, z;
  if (idx < 6) { // front row
    xStep = window.innerWidth / (1 + Math.min(6, num));
    x = xStep * (1 + idx);
    y = 150;
    z = 3;
    this.el.scaleX(1);
    this.el.scaleY(1);
  } else {
    xStep = window.innerWidth / (num - 5);
    x = xStep * (idx - 5);
    y = 50;
    z = 2;
    this.el.scaleX(0.5);
    this.el.scaleY(0.5);
  }
  var r = 90 * (x / window.innerWidth) - 45;
  var s = Math.pow(x / window.innerWidth - 0.5, 2) * 150;
  console.warn(s);
  this.el.position(x, y + s, z).rotationY(r);
  return this.el;
};

User.prototype.exit = function () {
  stage.removeChild(this.el);
  delete nodes[this.name];
  var idx = uqueue.indexOf(this);
  uqueue.splice(idx, 1);
};

var enter = function (key, data) {
  var obj = new User(key);
  nodes[key] = obj;
};
