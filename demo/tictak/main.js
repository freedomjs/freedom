/**
 * Backend module of the TicTakToe game
 * The interface between the frontend page
 * and this module is defined by a series of
 * freedom.emit / freedom.on message-passing calls.
 * 'freedom' is a special object in all modules that
 * allow you to communicate with the parent page
 **/

// Initialize a new instance of our storage module
// Note: The manifest file specifies the name of this dependency ('localstorage')
//  and the fact that it adheres to the FreeDOM Storage API
var store = freedom.localstorage();

// Internal State
var board = null;
var playerMove = true;

// Startup emission of stats.
function stats(player, other) {
  // Fetch historical score. Note that calls to FreeDOM providers
  // are asynchronous. It returns a promise, which you can feed a callback
  // to call when the method completes.
  var promise = store.get('stats');
  promise.then(function(val) {
    var nv;
    try {
      nv = JSON.parse(val);
      val = JSON.parse(val);
    } catch(e) {}
    if (!nv || typeof nv !== "object") {
      nv = {
        win: 0, 
        lose: 0
      };
    }
    if (!nv.win) {
      nv.win = 0;
    }
    if (!nv.lose) {
      nv.lose = 0;
    }
    if (player) {
      nv.win += 1;
    }
    if (other) {
      nv.lose += 1;
    }

    if (nv !== val) {
      store.set('stats', JSON.stringify(nv));
    }

    // This sends the game stats to the frontend to display
    freedom.emit('stats', nv);
  });
}
//setTimeout(stats, 0);
stats();

// Receive moves from the frontend page
freedom.on('move', function(val) {
  if (playerMove && board[val] === 0) {
    board[val] = 1;
    checkWin();
    playerMove = false;
    aiMove();
  }

  var b = {};
  for (var i = 0; i < 9; i++) {
    b[i] = board[i];
  }
  // This sends the board state to the front-end to display
  freedom.emit('board', b);
});

// Reset the current global state
function reset() {
  board = [0,0,0,0,0,0,0,0,0];
  playerMove = true;
}
reset();

// Implements a simple TicTakToe AI
function aiMove() {
  if (playerMove) {
    return;
  }
  // Center Move is good.
  if (board[4] === 0) {
    board[4] = 2;
    checkWin();
    playerMove = true;
    return;
  }
  // Counter.
  var sets = "012,345,678,036,147,258,048,246".split(",");
  for (var s = 0; s < sets.length; s++) {
    var set = sets[s].split("");
    for (var p = 0; p < 3; p++) {
      if (board[set[p === 0 ? 1 : 0]] === 1 &&
          board[set[p !== 2 ? 2 : 1]] === 1 &&
          board[set[p]] === 0) {
        board[set[p]] = 2;
        checkWin();
        playerMove = true;
        return;
      }
    }
  }
  
  // Random move.
  while(!playerMove) {
    var m = Math.floor(Math.random() * 9);
    if(board[m] === 0) {
      board[m] = 2;
      checkWin();
      playerMove = true;
      return;
    }
  }
}

// Check for game completion
function checkWin() {
  var sets = "012,345,678,036,147,258,048,246".split(",");
  for (var s = 0; s < sets.length; s++) {
    var set = sets[s].split("");
    if (board[set[0]] === board[set[1]] &&
        board[set[1]] === board[set[2]]) {
      if (board[set[2]] === 1) {
        // player wins
        stats(1, 0);
        reset();
      } else if (board[set[2]] === 2) {
        // other wins
        stats(0, 1);
        reset();
      }
    }
  }
  var open = 0;
  for (var i = 0; i < 9; i++) {
    if (board[i] === 0) {
      open = 1;
    }
  }
  if (open === 0) {
    stats(0,0);
    reset();
  }
}
