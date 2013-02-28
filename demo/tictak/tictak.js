var storage = freedom.storage();

var board = null;
var playerMove = true;

// Startup emission of stats.
function stats(player, other) {
  var promise = storage.get('stats');
  promise.done(function(val) {
    var nv;
    try {
      nv = JSON.parse(val);
      val = JSON.parse(val);
    } catch(e) {}
    if (!nv || typeof nv !== "object") nv = {win: 0, lose: 0};
    if (!nv['win']) nv['win'] = 0;
    if (!nv['lose']) nv['lose'] = 0;
    if (player) nv['win'] += 1;
    if (other) nv['lose'] += 1;

    if (nv !== val) {
      storage.set('stats', JSON.stringify(nv));
    }

    freedom.emit('stats', nv);
  });
};
setTimeout(stats, 0);

freedom.on('move', function(val) {
  if (playerMove && board[val] == 0) {
    board[val] = 1;
    checkWin();
    playerMove = false;
    AIMove();
  }

  var b = {};
  for (var i = 0; i < 9; i++) {
    b[i] = board[i];
  }
  freedom.emit('board', b);
});

function reset() {
  board = [0,0,0,0,0,0,0,0,0];
  playerMove = true;
}
reset();

function AIMove() {
  if (playerMove) {
    return;
  }
  // Center Move is good.
  if (board[4] == 0) {
    board[4] = 2;
    checkWin();
    playerMove = true;
  }
  // Counter.
  var sets = "012,345,678,036,147,258,048,246".split(",");
  for (var s = 0; s < sets.length; s++) {
    var set = sets[s].split("");
    for (var p = 0; p < 3; p++) {
      if (board[set[p == 0? 1 : 0]] == 1 && board[set[p!= 2 ? 2 : 1]] == 1 && board[set[p]] == 0) {
        board[set[p]] = 2;
        checkWin();
        playerMove = true;
      }
    }
  }
  
  // Random move.
  while(!playerMove) {
    var m = Math.floor(Math.random() * 9)
    if(board[m] == 0) {
      board[m] = 2;
      checkWin();
      playerMove = true;
    }
  }
}

function checkWin() {
  var sets = "012,345,678,036,147,258,048,246".split(",");
  for (var s = 0; s < sets.length; s++) {
    var set = sets[s].split("");
    if (board[set[0]] == board[set[1]] && board[set[1]] == board[set[2]] && board[set[2]] == 1) {
      //playerwin
      stats(1, 0);
      reset()
    } else if (board[set[0]] == board[set[1]] && board[set[1]] == board[set[2]] && board[set[2]] == 2) {
      //otherwin
      stats(0, 1);
      reset();
    }
  }
  var open = 0;
  for (var i = 0; i < 9; i++) {
    if (board[i] == 0) {
      open = 1;
    }
  }
  if (open == 0) {
    stats(0,0);
    reset();
  }
}