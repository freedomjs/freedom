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
var brights = [
    '#0000ff', '#0033ff',
    '#00ff00', '#00cc33',
    '#3434ff', '#2098ff',
    '#21e831', '#0df088',
    '#00ff14', '#baff00',
    '#6cff00', '#63cb2c',
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
    reset();
    setupStage();
  } else if (msg.data.event === 'status') {
    document.body.className = 'okay';
    container.innerHTML = '<div class="striped">' +
      (msg.data.online || 'Connecting') + '</div>';
    reset();
  } else if (msg.data.event === 'user') {
    updateUsers(msg.data.users);
  } else {
    console.warn('ignored ' + msg.data.event);
  }
}, false);

window.addEventListener('resize', function() {
  updateUsers(nodes);
}, false);

var setupStage = function () {
  container.innerHTML = '';
  var cb = typeof stage === 'function' ? stage : function() {};
  stage = Sprite3D.stage(container);
  
  // Background.
  var panels = [];
  for (var i = 0; i < 20; i++) {
    var sprite = Sprite3D.create(".panel").x(i * 70).z(0);
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

var reset = function() {
  for (var node in nodes) {
    if (nodes.hasOwnProperty(node)) {
      nodes[node].exit(true);
    }
  }
  nodes = {};
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
  mask.css('backgroundImage', 'url(' + this.image + ')').z(300);
  this.el.appendChild(mask);
  this.layout().scaleX(0).scaleY(0).update();
  stage.appendChild(this.el);
  uqueue.push(this);
  this.phase = 'entry';
  setTimeout(function() {
    this.phase = 'entered';
    this.layout().update();
  }.bind(this), 0);
  this.color = Math.floor(Math.random() * brights.length / 2);
  this.interval = setInterval(this.animate.bind(this), 3000);
  this.animate();
};

User.prototype.animate = function() {
  if (this.a == 1) {
    this.a = 2;
    this.el.css('backgroundColor', brights[2 * this.color]);
    this.el.css('backgroundSize', '13px 13px, 29px 29px, 37px 37px, 53px 53px');
  } else {
    this.a = 1;
    this.el.css('backgroundColor', brights[2 * this.color + 1]);
    this.el.css('backgroundSize', '20px 20px, 19px 19px, 47px 47px, 40px 40px');
  }
};

User.prototype.layout = function () {
  if (this.phase !== 'entered') {
    return this.el;
  }
  var idx = uqueue.indexOf(this);
  var num = uqueue.length;
  var x, xStep, y, z;
  var frontRow = window.innerWidth > 1024 ? 6 : window.innerWidth > 640 ? 4 : 3;
  
  if (idx < frontRow) { // front row
    xStep = window.innerWidth / (1 + Math.min(frontRow, num));
    x = xStep * (1 + idx);
    y = 150;
    z = 300;
    this.el.scaleX(1);
    this.el.scaleY(1);
  } else {
    xStep = window.innerWidth / (num + 1 - frontRow);
    x = xStep * (idx + 1 - frontRow);
    y = 50;
    z = 200;
    this.el.scaleX(0.5);
    this.el.scaleY(0.5);
  }
  var r = 90 * (x / window.innerWidth) - 45;
  var s = Math.pow(x / window.innerWidth - 0.5, 2) * 150;
  this.el.position(x - 75, y + s, z).rotationY(r);
  return this.el;
};

User.prototype.exit = function (killed) {
  clearInterval(this.interval);
  if (!killed) {
    stage.removeChild(this.el);
    delete nodes[this.name];
  }
  var idx = uqueue.indexOf(this);
  uqueue.splice(idx, 1);
};

var enter = function (key, data) {
  var obj = new User(key);
  nodes[key] = obj;
};
