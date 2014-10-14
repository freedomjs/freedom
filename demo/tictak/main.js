/*globals freedom*/
/**
 * Backend module of the TicTakToe game
 * The interface between the frontend page
 * and this module is defined by a series of
 * freedom.emit / freedom.on message-passing calls.
 * 'freedom' is a special object in all modules that
 * allow you to communicate with the parent page
 **/
var currentBoard;

var Board = function (dispatchEvent) {
  'use strict';
  this.dispatchEvent = dispatchEvent;
  currentBoard = this;

  this.score = {win: 0, lose: 0};
  this.state = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.playerMove = true;
  this.store = freedom.localstorage();

  this.loadStats();
};

// This is called by the front end.
Board.prototype.move = function (spot) {
  'use strict';
  if (this.playerMove && this.state[spot] === 0) {
    this.state[spot] = 1;
    this.checkWin();
    this.playerMove = false;
    this.aiMove();
  }

  // This sends the board state to the front-end to display
  this.dispatchEvent('update', this.state);
};

Board.prototype.loadStats = function () {
  'use strict';
  this.store.get('stats').then(function (value) {
    var numericScore;
    try {
      numericScore = JSON.parse(value);
    } catch (e) {
      // Pass.
    }

    this.score.win = numericScore.win || 0;
    this.score.lose = numericScore.lose || 0;
    this.dispatchEvent('stats', this.score);
  }.bind(this), function () {
    this.finishGame();
  }.bind(this));
};

Board.prototype.finishGame = function () {
  'use strict';
  this.state = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.playerMove = true;

  this.store.set('stats', JSON.stringify(this.score));
  this.dispatchEvent('stats', this.score);
};

Board.prototype.aiMove = function () {
  'use strict';
  if (this.playerMove) {
    return;
  }

  // Center Move is good.
  if (this.state[4] === 0) {
    this.state[4] = 2;
    this.checkWin();
    this.playerMove = true;
    return;
  }
  // Counter.
  var sets = ["012", "345", "678", "036", "147", "258", "048", "246"],
    s,
    set,
    p,
    m;
  for (s = 0; s < sets.length; s += 1) {
    set = sets[s].split("");
    for (p = 0; p < 3; p += 1) {
      if (this.state[set[p === 0 ? 1 : 0]] === 1 &&
          this.state[set[p !== 2 ? 2 : 1]] === 1 &&
          this.state[set[p]] === 0) {
        this.state[set[p]] = 2;
        this.checkWin();
        this.playerMove = true;
        return;
      }
    }
  }
  
  // Random move.
  while (!this.playerMove) {
    m = Math.floor(Math.random() * 9);
    if (this.state[m] === 0) {
      this.state[m] = 2;
      this.checkWin();
      this.playerMove = true;
      return;
    }
  }
};

// Check for game completion
Board.prototype.checkWin = function () {
  'use strict';
  var sets = ["012", "345", "678", "036", "147", "258", "048", "246"],
    s,
    set,
    open = 0,
    i;
  for (s = 0; s < sets.length; s += 1) {
    set = sets[s].split("");
    if (this.state[set[0]] === this.state[set[1]] &&
        this.state[set[1]] === this.state[set[2]]) {
      if (this.state[set[2]] === 1) {
        // player wins
        this.score.win += 1;
        this.finishGame();
        return;
      } else if (this.state[set[2]] === 2) {
        // other wins
        this.score.lose += 1;
        this.finishGame();
        return;
      }
    }
  }
  for (i = 0; i < 9; i += 1) {
    if (this.state[i] === 0) {
      open = 1;
    }
  }
  if (open === 0) {
    this.finishGame();
    return;
  }
};

freedom().provideSynchronous(Board);
