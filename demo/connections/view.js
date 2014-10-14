/*jslint sloppy:true */
/*globals console, qr */
var base = 'http://www.freedomjs.org/?user=';
var darks = [
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
    '#6cff00', '#63cb2c'
  ];

var container;
var stage;
var nodes = {};
var uqueue = [];
var enter;

var reset = function () {
  var node;
  for (node in nodes) {
    if (nodes.hasOwnProperty(node)) {
      nodes[node].exit(true);
    }
  }
  nodes = {};
};

var permute = function (panels) {
  var first = Math.floor(Math.random() * panels.length),
    second = Math.floor(Math.random() * panels.length),
    out = panels[first],
    i,
    rotate;
  panels[first] = panels[second];
  panels[second] = out;
  for (i = 0; i < panels.length; i += 1) {
    panels[i].style.left = i * 70 + 'px';
    panels[i].style.width = Math.random() * 150  + 'px';
    panels[i].style.background = darks[Math.floor(Math.random() * 20)];
    rotate = 'rotate(' + (Math.random() * 10 - 5) + 'deg)';
    panels[i].style.transform = rotate;
    panels[i].style.MozTransform = rotate;
    panels[i].style.webkitTransform = rotate;
  }
};

var setupStage = function () {
  container.innerHTML = '';
  var cb = typeof stage === 'function' ? stage : function () {},
    panels = [],
    i,
    panel;
  stage = container;
  
  
  // Background.
  for (i = 0; i < 20; i += 1) {
    panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.left = i * 70 + 'px';
    stage.appendChild(panel);
    panels.push(panel);
  }
  setInterval(permute.bind({}, panels), 2000);
  cb();
};

var updateUsers = function (users) {
  var user, node;
  
  if (!stage || typeof stage === 'function') {
    stage = updateUsers.bind({}, users);
    return;
  }
  for (user in users) {
    if (users.hasOwnProperty(user) && !nodes[user]) {
      enter(user, users[user]);
    }
  }
  for (node in nodes) {
    if (nodes.hasOwnProperty(node) && !users[node]) {
      nodes[node].exit();
    }
  }
  for (node in nodes) {
    if (nodes.hasOwnProperty(node)) {
      nodes[node].layout();
    }
  }
};

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

window.addEventListener('resize', function () {
  updateUsers(nodes);
}, false);

var User = function (name) {
  this.name = name;
  this.phase = 'entered';
  this.image = qr.image({
    value: base + name,
    background: 'rgba(255,0,0,0)'
  });
  this.image.className = 'mask';
  this.el = document.createElement('div');
  this.el.className = 'node';
  this.el.appendChild(this.image);
  this.layout();
  this.el.style.width = 0;
  this.el.style.height = 0;
  stage.appendChild(this.el);
  uqueue.push(this);
  this.phase = 'entry';
  setTimeout(function () {
    this.phase = 'entered';
    this.layout();
  }.bind(this), 0);
  this.color = Math.floor(Math.random() * brights.length / 2);
  this.interval = setInterval(this.animate.bind(this), 3000);
  this.el.addEventListener('click', this.onClick.bind(this), false);
  this.animate();
};

User.prototype.animate = function () {
  if (this.a === 1) {
    this.a = 2;
    this.el.style.backgroundColor = brights[2 * this.color];
    this.el.style.backgroundSize = '13px 13px, 29px 29px, 37px 37px, 53px 53px';
  } else {
    this.a = 1;
    this.el.style.backgroundColor = brights[2 * this.color + 1];
    this.el.style.backgroundSize = '20px 20px, 19px 19px, 47px 47px, 40px 40px';
  }
};

User.prototype.onClick = function () {
  window.parent.postMessage(this.name, '*');
};

User.prototype.layout = function () {
  if (this.phase !== 'entered') {
    return this.el;
  }
  var idx = uqueue.indexOf(this),
    num = uqueue.length,
    x,
    xStep,
    y,
    size,
    frontRow = window.innerWidth > 1024 ? 6 : window.innerWidth > 640 ? 4 : 3,
    r,
    s;
  
  if (idx < frontRow) { // front row
    xStep = window.innerWidth / (1 + Math.min(frontRow, num));
    x = xStep * (1 + idx);
    y = 150;
    size = 100;
  } else {
    xStep = window.innerWidth / (num + 1 - frontRow);
    x = xStep * (idx + 1 - frontRow);
    y = 50;
    size = 50;
  }
  r = size - size * 0.5 * (Math.pow(x / window.innerWidth - 0.5, 2) * 4);
  s = Math.pow(x / window.innerWidth - 0.5, 2) * 2 * 150;
  this.el.style.left = x - 75 + 'px';
  this.el.style.top = y + s + 'px';
  this.el.style.width = r + 'px';
  this.el.style.height = size + 'px';
  
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

enter = function (key, data) {
  var obj = new User(key);
  nodes[key] = obj;
};
