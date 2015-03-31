/*jslint sloppy:true,browser:true*/
/*globals freedom*/

// After loading freedom.js, the window is populated with a 'freedom'
// object, which is used as a message passing channel to the root module
var buttonLabels = ['CreateOffer', 'CreateAnswer', 'GiveAnswer', 'Send'];
var negotiateState = function (text, button, channel) {
  var state = {at: 0, text: text, button: button, channel: channel};
  button.innerText = 'CreateOffer';
  channel.on('ice', function (ice) {
    state.text.value += '\n' + ice;
  });
  button.addEventListener('click', function (state) {
    if (state.at === 0) {
      channel.initiate({}).then(function (state, offer) {
        state.text.value = JSON.stringify(offer);
      }.bind({}, state));
      state.at = 2;
    } else if (state.at === 1) {
      channel.respond(state.text.value).then(function (state, answer) {
        state.text.value = JSON.stringify(answer);
        state.at = 3;
        state.button.innerText = buttonLabels[state.at];
      }.bind({}, state));
    } else if (state.at === 2) {
      channel.finish(state.text.value);
      state.at = 3;
    } else if (state.at === 3) {
      channel.send(state.text.value);
    }
    state.button.innerText = buttonLabels[state.at];
  }.bind({}, state));
  text.addEventListener('change', function (state) {
    if (state.at < 2) {
      state.at = (state.text.value !== '') ? 1 : 0;
    }
    state.button.innerText = buttonLabels[state.at];
  }.bind({}, state));
};

window.onload = function () {
  freedom("freedom-module.json", {
    "debug": "info"
  }).then(function (DataChannel) {
    var alice = new DataChannel('Alice'),
      bob = new DataChannel('Bob'),
      append;

    append = function (msg) {
      this.innerHTML += "<br /> " + msg;
    };

    alice.on('message', append.bind(document.getElementById('alice')));
    bob.on('message', append.bind(document.getElementById('bob')));
    negotiateState(document.getElementById('aliceText'), document.getElementById('aliceButton'), alice);
    negotiateState(document.getElementById('bobText'), document.getElementById('bobButton'), bob);
  });
};
