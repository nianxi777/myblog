var canvas = document.getElementById('board');
var ctx = canvas.getContext('2d');
var size = 15;
var padding = 34;
var step = (canvas.width - padding * 2) / (size - 1);
var board = [];
var current = 'black';
var finished = false;
var blackCount = 0;
var whiteCount = 0;
var mode = 'ai';
var difficulty = 'easy';
var aiThinking = false;
var aiTimer = null;
var difficulties = ['easy', 'normal', 'hard', 'master'];
var difficultyNames = { easy: '简单', normal: '标准', hard: '困难', master: '大师' };

function newGame() {
  closeResultModal();
  if (aiTimer) clearTimeout(aiTimer);
  aiThinking = false;
  board = [];
  for (var r = 0; r < size; r++) {
    board[r] = [];
    for (var c = 0; c < size; c++) board[r][c] = '';
  }
  current = 'black';
  finished = false;
  blackCount = 0;
  whiteCount = 0;
  updateControls();
  updatePanel(mode === 'ai' ? '轮到你落子。' : '黑棋先手，请落子。');
  draw();
}

function updateControls() {
  document.getElementById('modeBtn').innerHTML = mode === 'ai' ? '模式：人机' : '模式：双人';
  document.getElementById('difficultyBtn').innerHTML = '难度：' + difficultyNames[difficulty];
  document.getElementById('intro').innerHTML = mode === 'ai' ? '人机模式：你执黑先手，电脑执白后手。' : '双人模式：双方轮流点击交叉点落子。';
}

function toggleMode() {
  mode = mode === 'ai' ? 'duo' : 'ai';
  newGame();
}

function cycleDifficulty() {
  var index = difficulties.indexOf(difficulty);
  difficulty = difficulties[(index + 1) % difficulties.length];
  newGame();
}

function updatePanel(message) {
  document.getElementById('blackCount').innerHTML = String(blackCount);
  document.getElementById('whiteCount').innerHTML = String(whiteCount);
  document.getElementById('status').innerHTML = message;
}

function showResultModal(title, message) {
  document.getElementById('resultTitle').innerHTML = title;
  document.getElementById('resultMessage').innerHTML = message;
  document.getElementById('resultModal').className = 'result-modal show';
}

function closeResultModal() {
  document.getElementById('resultModal').className = 'result-modal';
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#d6e8f4');
  gradient.addColorStop(.52, '#9fb9cf');
  gradient.addColorStop(1, '#6f8aa3');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(8, 25, 43, .56)';
  ctx.lineWidth = 1;
  for (var i = 0; i < size; i++) {
    var pos = padding + i * step;
    ctx.beginPath();
    ctx.moveTo(padding, pos);
    ctx.lineTo(canvas.width - padding, pos);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos, padding);
    ctx.lineTo(pos, canvas.height - padding);
    ctx.stroke();
  }

  drawStar(3, 3);
  drawStar(3, 11);
  drawStar(7, 7);
  drawStar(11, 3);
  drawStar(11, 11);

  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      if (board[r][c]) drawPiece(r, c, board[r][c]);
    }
  }
}

function drawStar(row, col) {
  ctx.beginPath();
  ctx.arc(padding + col * step, padding + row * step, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 25, 43, .70)';
  ctx.fill();
}

function drawPiece(row, col, color) {
  var x = padding + col * step;
  var y = padding + row * step;
  var radius = step * .38;
  var gradient = ctx.createRadialGradient(x - radius * .35, y - radius * .35, radius * .1, x, y, radius);
  if (color === 'black') {
    gradient.addColorStop(0, '#4b5565');
    gradient.addColorStop(.38, '#161b24');
    gradient.addColorStop(1, '#020407');
  } else {
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(.58, '#f1f5f9');
    gradient.addColorStop(1, '#cbd5e1');
  }
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.shadowColor = color === 'black' ? 'rgba(0,0,0,.42)' : 'rgba(4, 12, 24, .46)';
  ctx.shadowBlur = color === 'black' ? 8 : 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = color === 'black' ? 1.2 : 2.4;
  ctx.strokeStyle = color === 'black' ? 'rgba(255,255,255,.14)' : 'rgba(8, 25, 43, .62)';
  ctx.stroke();
}

function placePiece(row, col, source) {
  if (finished || aiThinking || board[row][col]) return false;
  if (mode === 'ai' && source !== 'ai' && current !== 'black') return false;
  board[row][col] = current;
  if (current === 'black') blackCount++;
  else whiteCount++;
  draw();
  if (hasWon(row, col, current)) {
    var winner = current === 'black' ? '黑棋' : '白棋';
    finished = true;
    updatePanel(winner + '获胜！点击新游戏再来一局。');
    showResultModal(winner + '获胜！', '点击“确定”关闭弹窗复盘，或点击“再来一局”重新开始。');
    return true;
  }
  if (blackCount + whiteCount === size * size) {
    finished = true;
    updatePanel('棋盘已满，平局。');
    showResultModal('平局！', '点击“确定”关闭弹窗复盘，或点击“再来一局”重新开始。');
    return true;
  }
  current = current === 'black' ? 'white' : 'black';
  if (mode === 'ai' && current === 'white') scheduleAiMove();
  else updatePanel(mode === 'ai' ? '轮到你落子。' : '轮到' + (current === 'black' ? '黑棋' : '白棋') + '落子。');
  return true;
}

function scheduleAiMove() {
  aiThinking = true;
  updatePanel('电脑思考中...');
  aiTimer = setTimeout(function() {
    var move = chooseAiMove();
    aiThinking = false;
    if (move) placePiece(move.row, move.col, 'ai');
  }, 250);
}

function chooseAiMove() {
  var moves = candidateMoves();
  if (moves.length === 0) return { row: 7, col: 7 };
  for (var i = 0; i < moves.length; i++) {
    if (isWinningMove(moves[i].row, moves[i].col, 'white')) return moves[i];
  }
  for (var j = 0; j < moves.length; j++) {
    if (isWinningMove(moves[j].row, moves[j].col, 'black')) return moves[j];
  }
  var best = null;
  var bestScore = -Infinity;
  for (var k = 0; k < moves.length; k++) {
    var move = moves[k];
    var score = scoreMove(move.row, move.col);
    if (difficulty === 'master') score -= futureRisk(move.row, move.col);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function candidateMoves() {
  if (blackCount + whiteCount === 0) return [{ row: 7, col: 7 }];
  var moves = [];
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      if (!board[r][c] && hasNeighbor(r, c, difficulty === 'easy' ? 1 : 2)) moves.push({ row: r, col: c });
    }
  }
  return moves;
}

function hasNeighbor(row, col, distance) {
  for (var r = row - distance; r <= row + distance; r++) {
    for (var c = col - distance; c <= col + distance; c++) {
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c]) return true;
    }
  }
  return false;
}

function scoreMove(row, col) {
  var weights = {
    easy: { attack: 1, defense: 1.05, center: 8 },
    normal: { attack: 1.15, defense: 1.18, center: 6 },
    hard: { attack: 1.22, defense: 1.35, center: 4 },
    master: { attack: 1.34, defense: 1.56, center: 2 }
  }[difficulty];
  var attack = evaluatePoint(row, col, 'white');
  var defense = evaluatePoint(row, col, 'black');
  var center = 14 - (Math.abs(row - 7) + Math.abs(col - 7));
  var score = attack * weights.attack + defense * weights.defense + center * weights.center;
  if (difficulty === 'master') score += compoundThreatScore(row, col, 'white') * 1.15 + compoundThreatScore(row, col, 'black') * 1.45;
  return score;
}

function evaluatePoint(row, col, color) {
  var directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var score = 0;
  for (var i = 0; i < directions.length; i++) {
    var line = lineInfo(row, col, directions[i][0], directions[i][1], color);
    score += patternScore(line.count, line.open);
  }
  return score;
}

function lineInfo(row, col, dr, dc, color) {
  var forward = countLine(row, col, dr, dc, color);
  var backward = countLine(row, col, -dr, -dc, color);
  return { count: 1 + forward.count + backward.count, open: forward.open + backward.open };
}

function countLine(row, col, dr, dc, color) {
  var count = 0;
  var r = row + dr;
  var c = col + dc;
  while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
    count++;
    r += dr;
    c += dc;
  }
  return { count: count, open: r >= 0 && r < size && c >= 0 && c < size && !board[r][c] ? 1 : 0 };
}

function patternScore(count, open) {
  if (count >= 5) return 1000000;
  if (count === 4 && open === 2) return 120000;
  if (count === 4 && open === 1) return 50000;
  if (count === 3 && open === 2) return 12000;
  if (count === 3 && open === 1) return 3000;
  if (count === 2 && open === 2) return 800;
  if (count === 2 && open === 1) return 180;
  if (count === 1 && open === 2) return 40;
  return 8;
}

function compoundThreatScore(row, col, color) {
  var directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var liveFour = 0;
  var four = 0;
  var liveThree = 0;
  var three = 0;
  for (var i = 0; i < directions.length; i++) {
    var line = lineInfo(row, col, directions[i][0], directions[i][1], color);
    if (line.count >= 4 && line.open === 2) liveFour++;
    else if (line.count >= 4 && line.open === 1) four++;
    else if (line.count === 3 && line.open === 2) liveThree++;
    else if (line.count === 3 && line.open === 1) three++;
  }
  if (liveFour >= 1 && liveThree >= 1) return 180000;
  if (four >= 2 || liveFour >= 2) return 160000;
  if (liveThree >= 2) return 90000;
  if (liveThree >= 1 && three >= 1) return 42000;
  return liveFour * 60000 + four * 22000 + liveThree * 12000 + three * 2400;
}

function futureRisk(row, col) {
  board[row][col] = 'white';
  var moves = candidateMoves();
  var risk = 0;
  for (var i = 0; i < moves.length; i++) {
    risk = Math.max(risk, evaluatePoint(moves[i].row, moves[i].col, 'black') + compoundThreatScore(moves[i].row, moves[i].col, 'black'));
  }
  board[row][col] = '';
  return risk * .62;
}

function isWinningMove(row, col, color) {
  board[row][col] = color;
  var won = hasWon(row, col, color);
  board[row][col] = '';
  return won;
}

function hasWon(row, col, color) {
  var directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (var i = 0; i < directions.length; i++) {
    var total = 1 + countDirection(row, col, directions[i][0], directions[i][1], color) + countDirection(row, col, -directions[i][0], -directions[i][1], color);
    if (total >= 5) return true;
  }
  return false;
}

function countDirection(row, col, dr, dc, color) {
  var count = 0;
  var r = row + dr;
  var c = col + dc;
  while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === color) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}

function canvasPoint(event) {
  var rect = canvas.getBoundingClientRect();
  var touch = event.touches && event.touches[0] ? event.touches[0] : event;
  return {
    x: (touch.clientX - rect.left) * canvas.width / rect.width,
    y: (touch.clientY - rect.top) * canvas.height / rect.height
  };
}

function handleMove(event) {
  if (event.preventDefault) event.preventDefault();
  if (finished || aiThinking) return;
  var point = canvasPoint(event);
  var col = Math.round((point.x - padding) / step);
  var row = Math.round((point.y - padding) / step);
  if (row < 0 || row >= size || col < 0 || col >= size) return;
  var x = padding + col * step;
  var y = padding + row * step;
  if (Math.hypot(point.x - x, point.y - y) > step * .45) return;
  placePiece(row, col, 'player');
}

canvas.addEventListener('click', handleMove);
canvas.addEventListener('touchstart', handleMove, { passive: false });

newGame();
