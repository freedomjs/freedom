var entry = require('../../src/entry');
var testUtil = require('../util');
var direct = require('../../src/link/direct');

describe("FreedomModule", function() {
  var freedom, global, h = [];
  beforeEach(function() {
    global = {
      directLink: {
        emit: function(flow, msg) {
          h.push([flow, msg]);
        }
      }
    };

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/'),
        dir = path.substr(0, dir_idx) + '/';
    freedom = entry({
      'portType': direct,
      'isModule': true,
      'providers': [],
      'global': global
    });
  });
  
  it("Initiates connection outwards.", function() {
    expect(h.length).toBeGreaterThan(0);
  });
});
