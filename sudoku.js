'use strict';

// ── Theme ─────────────────────────────────────────────────────────────────────

const FONTS = [
  '"Lobster", cursive',
  '"Pacifico", cursive',
  '"Orbitron", monospace',
  '"Permanent Marker", cursive',
  '"Press Start 2P", monospace',
  '"Bebas Neue", sans-serif',
  '"Dancing Script", cursive',
  '"Righteous", cursive',
  '"Bangers", cursive',
  '"Alfa Slab One", serif',
  'Georgia, serif',
  '"Courier New", monospace',
  'Impact, sans-serif',
  '"Comic Sans MS", cursive',
  '"Times New Roman", serif',
];

function randomFont() {
  return FONTS[Math.floor(Math.random() * FONTS.length)];
}

let themeTyped  = '';
let themeOpen   = false;
let themeTarget = '';

function getTargetWord() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  return current === 'dark' ? 'light' : 'dark';
}

function openThemeOverlay() {
  themeOpen   = true;
  themeTyped  = '';
  themeTarget = getTargetWord();
  document.getElementById('theme-hint').textContent = `Enter password to change to ${themeTarget} mode ;-)`;
  document.getElementById('theme-overlay').classList.remove('hidden');
  const box = document.querySelector('.theme-box');
  box.classList.remove('pop-in');
  void box.offsetWidth; // force reflow to restart animation
  box.classList.add('pop-in');
  renderThemeTyped();
}

function closeThemeOverlay() {
  themeOpen = false;
  document.getElementById('theme-overlay').classList.add('hidden');
}

function renderThemeTyped() {
  const el    = document.getElementById('theme-typed');
  el.innerHTML = '';
  const typed = themeTyped.split('');
  const len   = themeTarget.length;

  for (let i = 0; i < len; i++) {
    if (i < typed.length) {
      const span = document.createElement('span');
      span.textContent = typed[i];
      span.style.fontFamily = randomFont();
      el.appendChild(span);
    } else {
      const dot = document.createElement('span');
      dot.className = 'dot-placeholder' + (i === typed.length ? ' dot-current' : '');
      el.appendChild(dot);
    }
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('sudoku-theme', theme);
  closeThemeOverlay();
}

function handleThemeKey(e) {
  e.preventDefault();

  if (e.key === 'Escape') {
    closeThemeOverlay();
    return;
  }

  if (e.key === 'Backspace') {
    themeTyped = themeTyped.slice(0, -1);
    renderThemeTyped();
    return;
  }

  if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
  if (themeTyped.length >= themeTarget.length) return;

  const nextChar = e.key.toLowerCase();
  const expected = themeTarget[themeTyped.length];

  if (nextChar !== expected) {
    const box = document.querySelector('.theme-box');
    box.classList.remove('pop-in', 'shake');
    void box.offsetWidth; // force reflow to restart animation
    box.classList.add('shake');
    setTimeout(() => box.classList.remove('shake'), 350);
    return;
  }

  themeTyped += nextChar;
  renderThemeTyped();

  if (themeTyped === themeTarget) {
    setTimeout(() => applyTheme(themeTarget), 250);
  }
}

// Close overlay when clicking the backdrop
document.getElementById('theme-overlay').addEventListener('click', e => {
  if (e.target.id === 'theme-overlay') closeThemeOverlay();
});

// Load saved theme on startup
(function () {
  const saved = localStorage.getItem('sudoku-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

// ── Utilities ─────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deepCopy(grid) {
  return grid.map(row => [...row]);
}

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function emptyNotes() {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
}

// ── Sudoku Engine ─────────────────────────────────────────────────────────────

function canPlace(grid, row, col, num) {
  for (let j = 0; j < 9; j++) if (grid[row][j] === num) return false;
  for (let i = 0; i < 9; i++) if (grid[i][col] === num) return false;
  const r = Math.floor(row / 3) * 3, c = Math.floor(col / 3) * 3;
  for (let i = r; i < r + 3; i++)
    for (let j = c; j < c + 3; j++)
      if (grid[i][j] === num) return false;
  return true;
}

function hasConflict(grid, row, col) {
  const num = grid[row][col];
  if (!num) return false;
  for (let j = 0; j < 9; j++)
    if (j !== col && grid[row][j] === num) return true;
  for (let i = 0; i < 9; i++)
    if (i !== row && grid[i][col] === num) return true;
  const r = Math.floor(row / 3) * 3, c = Math.floor(col / 3) * 3;
  for (let i = r; i < r + 3; i++)
    for (let j = c; j < c + 3; j++)
      if ((i !== row || j !== col) && grid[i][j] === num) return true;
  return false;
}

function fillGrid(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (canPlace(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle(difficulty) {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  for (let box = 0; box < 3; box++) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        grid[box * 3 + i][box * 3 + j] = nums[i * 3 + j];
  }

  fillGrid(grid);
  const solution = deepCopy(grid);
  const puzzle   = deepCopy(grid);

  const removals = { easy: 36, medium: 46, hard: 54 };
  let removed = 0;
  for (const idx of shuffle([...Array(81).keys()])) {
    if (removed >= removals[difficulty]) break;
    puzzle[Math.floor(idx / 9)][idx % 9] = 0;
    removed++;
  }

  return { puzzle, solution };
}

// ── Game State ────────────────────────────────────────────────────────────────

const game = {
  puzzle:     null,
  solution:   null,
  current:    null,
  locked:     null,
  notes:      null,   // notes[row][col] = Set of penciled numbers
  selected:   null,   // { row, col }
  history:    [],     // [{ row, col, prevVal, prevNotes }]
  pencilMode: false,
  difficulty: 'medium',
  startTime:  null,
  timerInterval: null,
  solved:     false,
};

// ── DOM References ────────────────────────────────────────────────────────────

const gridEl      = document.getElementById('grid');
const numpadEl    = document.getElementById('numpad');
const timerEl     = document.getElementById('timer');
const badgeEl     = document.getElementById('difficulty-badge');
const pencilBtn   = document.getElementById('btn-pencil');
const modalEl     = document.getElementById('modal');
const modalTimeEl = document.getElementById('modal-time');

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
  clearInterval(game.timerInterval);
  game.startTime = Date.now();
  game.timerInterval = setInterval(() => {
    timerEl.textContent = formatTime(Math.floor((Date.now() - game.startTime) / 1000));
  }, 1000);
}

function stopTimer() {
  clearInterval(game.timerInterval);
}

function elapsed() {
  return Math.floor((Date.now() - game.startTime) / 1000);
}

// ── New Game ──────────────────────────────────────────────────────────────────

function newGame(difficulty) {
  stopTimer();
  if (difficulty) game.difficulty = difficulty;
  const { puzzle, solution } = generatePuzzle(game.difficulty);
  game.puzzle     = puzzle;
  game.solution   = solution;
  game.current    = deepCopy(puzzle);
  game.locked     = puzzle.map(row => row.map(v => v !== 0));
  game.notes      = emptyNotes();
  game.selected   = null;
  game.history    = [];
  game.solved     = false;
  game.pencilMode = false;

  timerEl.textContent = '00:00';
  badgeEl.textContent = game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1);
  pencilBtn.classList.remove('active');
  numpadEl.classList.remove('pencil-active');
  modalEl.classList.add('hidden');
  document.getElementById('difficulty-dropdown').classList.add('hidden');
  document.getElementById('btn-new-game').classList.remove('active');

  render();
  startTimer();
}

// ── Pencil Mode ───────────────────────────────────────────────────────────────

function togglePencilMode() {
  game.pencilMode = !game.pencilMode;
  pencilBtn.classList.toggle('active', game.pencilMode);
  numpadEl.classList.toggle('pencil-active', game.pencilMode);
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  renderGrid();
  renderNumpad();
}

function renderGrid() {
  const sel    = game.selected;
  const selVal = sel ? game.current[sel.row][sel.col] : 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell     = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      const val      = game.current[row][col];
      const notes    = game.notes[row][col];
      const isLocked = game.locked[row][col];
      const isSelected = sel && sel.row === row && sel.col === col;
      const conflict = !isLocked && hasConflict(game.current, row, col);

      let highlighted = false;
      let sameNum     = false;
      if (sel && !isSelected) {
        const sameBox = Math.floor(row / 3) === Math.floor(sel.row / 3) &&
                        Math.floor(col / 3) === Math.floor(sel.col / 3);
        highlighted = row === sel.row || col === sel.col || sameBox;
        sameNum = selVal > 0 && val === selVal;
      }

      cell.className = 'cell';
      if (isLocked)        cell.classList.add('given');
      else if (conflict)   cell.classList.add('invalid');
      else if (val)        cell.classList.add('user-input');

      if (isSelected)                        cell.classList.add('selected');
      else if (sameNum)                      cell.classList.add('same-num');
      else if (highlighted)                  cell.classList.add('highlighted');

      // Content: value, notes, or empty
      if (val) {
        cell.textContent = val;
      } else if (notes.size > 0) {
        cell.textContent = '';
        const grid = document.createElement('div');
        grid.className = 'cell-notes';
        for (let n = 1; n <= 9; n++) {
          const span = document.createElement('span');
          span.className = 'note';
          span.textContent = notes.has(n) ? n : '';
          grid.appendChild(span);
        }
        cell.appendChild(grid);
      } else {
        cell.textContent = '';
      }
    }
  }
}

function renderNumpad() {
  const counts = Array(10).fill(0);
  for (const row of game.current)
    for (const val of row)
      if (val) counts[val]++;

  numpadEl.querySelectorAll('.num-btn[data-num]').forEach(btn => {
    const n = parseInt(btn.dataset.num);
    const remaining = 9 - counts[n];
    btn.classList.toggle('done', remaining === 0);
    const remEl = btn.querySelector('.remaining');
    if (remEl) remEl.textContent = remaining > 0 ? `${remaining} left` : '';
  });
}

// ── Input ─────────────────────────────────────────────────────────────────────

function selectCell(row, col) {
  if (game.solved) return;
  game.selected = { row, col };
  render();
}

function inputNumber(num) {
  if (!game.selected || game.solved) return;
  const { row, col } = game.selected;
  if (game.locked[row][col]) return;

  const curVal   = game.current[row][col];
  const curNotes = game.notes[row][col];

  if (num === 0) {
    // Erase: always works regardless of pencil mode
    if (curVal) {
      // Has confirmed number → clear it (notes will surface in render)
      game.history.push({ row, col, prevVal: curVal, prevNotes: new Set(curNotes) });
      game.current[row][col] = 0;
      render();
    } else if (curNotes.size) {
      // Has only pencil notes → clear them
      game.history.push({ row, col, prevVal: curVal, prevNotes: new Set(curNotes) });
      game.notes[row][col] = new Set();
      render();
    }
    return;
  }

  if (game.pencilMode) {
    if (curVal) return; // don't pencil into a confirmed cell
    game.history.push({ row, col, prevVal: curVal, prevNotes: new Set(curNotes) });
    if (curNotes.has(num)) curNotes.delete(num);
    else curNotes.add(num);
  } else {
    if (curVal === num && !curNotes.size) return; // no-op
    game.history.push({ row, col, prevVal: curVal, prevNotes: new Set(curNotes) });
    game.current[row][col] = num;
  }

  render();
  if (!game.pencilMode) checkWin();
}

function undo() {
  if (!game.history.length) return;
  const { row, col, prevVal, prevNotes } = game.history.pop();
  game.current[row][col] = prevVal;
  game.notes[row][col]   = prevNotes;
  game.selected = { row, col };
  render();
}

// ── Actions ───────────────────────────────────────────────────────────────────

function checkMistakes() {
  let found = false;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = game.current[row][col];
      if (!game.locked[row][col] && val && val !== game.solution[row][col]) {
        const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('mistake');
        setTimeout(() => cell.classList.remove('mistake'), 1500);
        found = true;
      }
    }
  }
  if (!found) {
    gridEl.style.outline = '3px solid #16a34a';
    gridEl.style.outlineOffset = '2px';
    setTimeout(() => { gridEl.style.outline = ''; gridEl.style.outlineOffset = ''; }, 800);
  }
}

function solveGame() {
  game.current  = deepCopy(game.solution);
  game.notes    = emptyNotes();
  game.solved   = true;
  game.selected = null;
  stopTimer();
  render();
}

function checkWin() {
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++)
      if (game.current[row][col] !== game.solution[row][col]) return;

  stopTimer();
  game.solved = true;
  modalTimeEl.textContent = `Solved in ${formatTime(elapsed())}`;
  setTimeout(() => {
    modalEl.classList.remove('hidden');
    startModalScramble();
    startConfetti();
  }, 300);
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  // Theme overlay captures all input when open
  if (themeOpen) { handleThemeKey(e); return; }

  // Shift alone opens the theme overlay
  if (e.key === 'Shift' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    openThemeOverlay();
    return;
  }

  if (game.solved) return;

  if (e.key === ' ')                                        { e.preventDefault(); togglePencilMode(); return; }

  const n = parseInt(e.key);
  if (n >= 1 && n <= 9)                                    { inputNumber(n); return; }
  if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') { inputNumber(0); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z')           { e.preventDefault(); undo(); return; }

  if (!game.selected) return;
  const { row, col } = game.selected;
  const dirs = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
  if (dirs[e.key]) {
    e.preventDefault();
    const [dr, dc] = dirs[e.key];
    selectCell(Math.max(0, Math.min(8, row + dr)), Math.max(0, Math.min(8, col + dc)));
  }
});

// ── Build DOM ─────────────────────────────────────────────────────────────────

function buildGrid() {
  gridEl.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', () => selectCell(row, col));
      gridEl.appendChild(cell);
    }
  }
}

function buildNumpad() {
  numpadEl.innerHTML = '';
  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.dataset.num = n;
    btn.innerHTML = `${n}<span class="remaining"></span>`;
    btn.addEventListener('click', () => inputNumber(n));
    numpadEl.appendChild(btn);
  }
  const erase = document.createElement('button');
  erase.className = 'num-btn erase';
  erase.textContent = '⌫';
  erase.addEventListener('click', () => inputNumber(0));
  numpadEl.appendChild(erase);
}

// ── Event Listeners ───────────────────────────────────────────────────────────

const diffDropEl  = document.getElementById('difficulty-dropdown');
const btnNewGame  = document.getElementById('btn-new-game');

function openDiffDropdown() {
  diffDropEl.classList.remove('hidden');
  btnNewGame.classList.add('active');
}

function closeDiffDropdown() {
  diffDropEl.classList.add('hidden');
  btnNewGame.classList.remove('active');
}


document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => newGame(btn.dataset.diff));
});

// ── Difficulty Badge Dropdown ──────────────────────────────────────────────────

document.querySelectorAll('.badge-diff-btn').forEach(btn => {
  btn.addEventListener('click', () => newGame(btn.dataset.diff));
});

document.getElementById('btn-play-again').addEventListener('click', () => {
  stopModalScramble();
  stopConfetti();
  newGame();
});
document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-check').addEventListener('click', checkMistakes);
document.getElementById('btn-solve').addEventListener('click', solveGame);
pencilBtn.addEventListener('click', togglePencilMode);

// ── Init ──────────────────────────────────────────────────────────────────────

buildGrid();
buildNumpad();
newGame();

// ── Modal Title Scramble ───────────────────────────────────────────────────────

(function () {
  const h2 = document.getElementById('modal-title');
  h2.innerHTML = 'Puzzle Complete!'.split('').map(c =>
    `<span class="modal-letter">${c === ' ' ? '&nbsp;' : c}</span>`
  ).join('');
})();

let modalScrambleInterval = null;

function startModalScramble() {
  const letters = document.querySelectorAll('.modal-letter');
  function scramble() {
    letters.forEach(span => { if (span.textContent.trim()) span.style.fontFamily = randomFont(); });
    applyDynamicAccent(randomAccentHSL());
  }
  scramble();
  modalScrambleInterval = setInterval(scramble, 200);
}

function stopModalScramble() {
  clearInterval(modalScrambleInterval);
  modalScrambleInterval = null;
  document.querySelectorAll('.modal-letter').forEach(span => { span.style.fontFamily = ''; });
}

// ── Confetti ───────────────────────────────────────────────────────────────────

let confettiCanvas = null;
let confettiCtx    = null;
let confettiRAF    = null;
let confettiParts  = [];

function initConfettiCanvas() {
  if (confettiCanvas) return;
  confettiCanvas = document.createElement('canvas');
  confettiCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99;';
  document.body.appendChild(confettiCanvas);
  confettiCtx = confettiCanvas.getContext('2d');
}

function makeParticle(rush) {
  const hue = Math.floor(Math.random() * 360);
  return {
    x:   Math.random() * window.innerWidth,
    y:   rush ? Math.random() * window.innerHeight * -0.2 : -12,
    w:   6 + Math.random() * 10,
    h:   4 + Math.random() * 6,
    color: `hsl(${hue},85%,60%)`,
    vx:  (Math.random() - 0.5) * 4,
    vy:  2 + Math.random() * 5,
    rot: Math.random() * Math.PI * 2,
    rotV:(Math.random() - 0.5) * 0.18,
    alpha: 1,
  };
}

function startConfetti() {
  initConfettiCanvas();
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiParts = Array.from({ length: 140 }, () => makeParticle(true));

  let spawned = 0;
  let tick = 0;
  cancelAnimationFrame(confettiRAF);

  function frame() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    tick++;
    if (tick % 2 === 0 && spawned < 80) { confettiParts.push(makeParticle(false)); spawned++; }

    confettiParts = confettiParts.filter(p => p.alpha > 0.04);

    for (const p of confettiParts) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.07;
      p.rot += p.rotV;
      if (p.y > confettiCanvas.height * 0.75) p.alpha -= 0.018;

      confettiCtx.save();
      confettiCtx.globalAlpha = p.alpha;
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    }

    if (confettiParts.length) confettiRAF = requestAnimationFrame(frame);
    else stopConfetti();
  }

  confettiRAF = requestAnimationFrame(frame);
}

function stopConfetti() {
  cancelAnimationFrame(confettiRAF);
  confettiRAF = null;
  confettiParts = [];
  if (confettiCtx) confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// ── Title hover scramble ───────────────────────────────────────────────────────

function randomAccentHSL() {
  const hue = Math.floor(Math.random() * 360);
  const sat = 75 + Math.floor(Math.random() * 20);  // 75–95%
  const lit = 55 + Math.floor(Math.random() * 15);  // 55–70%
  return { hue, sat, lit };
}

function applyDynamicAccent({ hue, sat, lit }) {
  const root    = document.documentElement;
  const isDark  = (root.getAttribute('data-theme') || 'dark') === 'dark';
  root.style.setProperty('--accent',       `hsl(${hue}, ${sat}%, ${lit}%)`);
  root.style.setProperty('--accent-hover', `hsl(${hue}, ${sat}%, ${lit - 10}%)`);
  root.style.setProperty('--accent-dim',   isDark
    ? `hsl(${hue}, ${sat}%, 14%)`
    : `hsl(${hue}, ${sat}%, 92%)`);
  root.style.setProperty('--user-color',   `hsl(${hue}, ${sat}%, ${lit}%)`);
  root.style.setProperty('--selected-bg',  isDark
    ? `hsl(${hue}, ${sat}%, 12%)`
    : `hsl(${hue}, ${sat}%, 92%)`);
  root.style.setProperty('--same-num-bg',  isDark
    ? `hsl(${hue}, ${sat}%, 9%)`
    : `hsl(${hue}, ${sat}%, 87%)`);
}

(function () {
  const h1 = document.querySelector('h1');
  h1.innerHTML = 'Sudoku'.split('').map(c => `<span class="title-letter">${c}</span>`).join('');

  let interval = null;

  function scrambleFonts() {
    h1.querySelectorAll('.title-letter').forEach(span => {
      span.style.fontFamily = randomFont();
    });
  }

  h1.addEventListener('mouseenter', () => {
    scrambleFonts();
    applyDynamicAccent(randomAccentHSL());
    interval = setInterval(() => {
      scrambleFonts();
      applyDynamicAccent(randomAccentHSL());
    }, 200);
  });

  h1.addEventListener('mouseleave', () => {
    clearInterval(interval);
    interval = null;
    h1.querySelectorAll('.title-letter').forEach(span => {
      span.style.fontFamily = '';
    });
    // accent color intentionally kept
  });
})();
