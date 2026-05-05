var size = 4;
var board = [];
var score = 0;
var best = 0;
var over = false;
var startX = 0;
var startY = 0;

function getBest() {
  try { return Number(window.localStorage.getItem('myblog-2048-best') || 0); }
  catch (e) { return 0; }
}

function saveBest(value) {
  try { window.localStorage.setItem('myblog-2048-best', String(value)); }
  catch (e) {}
}

function newGame() {
  board = [];
  for (var r = 0; r < size; r++) {
    board[r] = [];
    for (var c = 0; c < size; c++) board[r][c] = 0;
  }
  score = 0;
  over = false;
  best = getBest();
  document.getElementById('status').innerHTML = '游戏开始，合成 2048！';
  addTile();
  addTile();
  draw();
}

function addTile() {
  var empty = [];
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      if (board[r][c] === 0) empty.push({ r: r, c: c });
    }
  }
  if (empty.length === 0) return;
  var spot = empty[Math.floor(Math.random() * empty.length)];
  board[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
}

function draw() {
  var boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      var value = board[r][c];
      var cell = document.createElement('div');
      cell.className = 'cell' + (value ? ' tile-' + Math.min(value, 2048) : '');
      var span = document.createElement('span');
      span.innerHTML = value ? String(value) : '';
      cell.appendChild(span);
      boardEl.appendChild(cell);
    }
  }
  document.getElementById('score').innerHTML = String(score);
  if (score > best) {
    best = score;
    saveBest(best);
  }
  document.getElementById('best').innerHTML = String(best);
}

function mergeLine(line) {
  var values = [];
  var result = [];
  for (var i = 0; i < line.length; i++) {
    if (line[i] !== 0) values.push(line[i]);
  }
  for (var j = 0; j < values.length; j++) {
    if (values[j] === values[j + 1]) {
      var merged = values[j] * 2;
      result.push(merged);
      score += merged;
      j++;
    } else {
      result.push(values[j]);
    }
  }
  while (result.length < size) result.push(0);
  return result;
}

function boardText() {
  var text = '';
  for (var r = 0; r < size; r++) text += board[r].join(',') + ';';
  return text;
}

function move(direction) {
  if (over) return;
  var before = boardText();
  var r, c, line, merged;

  if (direction === 'left') {
    for (r = 0; r < size; r++) board[r] = mergeLine(board[r]);
  }
  if (direction === 'right') {
    for (r = 0; r < size; r++) {
      line = board[r].slice().reverse();
      board[r] = mergeLine(line).reverse();
    }
  }
  if (direction === 'up') {
    for (c = 0; c < size; c++) {
      line = [];
      for (r = 0; r < size; r++) line.push(board[r][c]);
      merged = mergeLine(line);
      for (r = 0; r < size; r++) board[r][c] = merged[r];
    }
  }
  if (direction === 'down') {
    for (c = 0; c < size; c++) {
      line = [];
      for (r = 0; r < size; r++) line.push(board[r][c]);
      merged = mergeLine(line.reverse()).reverse();
      for (r = 0; r < size; r++) board[r][c] = merged[r];
    }
  }

  if (before !== boardText()) {
    addTile();
    draw();
    if (hasValue(2048)) document.getElementById('status').innerHTML = '你已经合成 2048，可以继续挑战更高分！';
    if (!canMove()) {
      over = true;
      document.getElementById('status').innerHTML = '游戏结束，点击重新开始再来一局。';
    }
  }
}

function hasValue(value) {
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) if (board[r][c] === value) return true;
  }
  return false;
}

function canMove() {
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      if (board[r][c] === 0) return true;
      if (c < size - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < size - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

document.onkeydown = function(event) {
  event = event || window.event;
  var key = event.key || event.keyCode;
  var direction = null;
  if (key === 'ArrowLeft' || key === 'a' || key === 'A' || key === 37) direction = 'left';
  if (key === 'ArrowRight' || key === 'd' || key === 'D' || key === 39) direction = 'right';
  if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 38) direction = 'up';
  if (key === 'ArrowDown' || key === 's' || key === 'S' || key === 40) direction = 'down';
  if (direction) {
    if (event.preventDefault) event.preventDefault();
    move(direction);
    return false;
  }
};

document.getElementById('board').ontouchstart = function(event) {
  startX = event.touches[0].clientX;
  startY = event.touches[0].clientY;
};

document.getElementById('board').ontouchend = function(event) {
  var touch = event.changedTouches[0];
  var dx = touch.clientX - startX;
  var dy = touch.clientY - startY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
};

newGame();
