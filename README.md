# Rhythm Rush — Improved Magic Tiles (No Auth)

An improved, client‑side implementation of a rhythm tile tapping game (playable in the browser). Originally based on a minimal Magic Tiles MVP, this version adds a polished user experience with a modern colour palette, subtle animations and refined UI.
Core features:

  - **4‑column tile gameplay:** tiles fall down the screen and must be tapped when they cross the hit line.
  - **Touch, mouse and keyboard input:** tap/click with your finger or mouse; use the **Space** key to pause or resume.
  - **Difficulty scaling:** tiles speed up and spawn more frequently over time.
  - **Single life:** missing a tile or tapping an empty column ends the game.
  - **Live score & high score:** your best score is saved in `localStorage`.
  - **Polished UI:** modern colours, gradient buttons, fade‑in overlays and subtle animations (shake on game over, pulse on new high score).
  - **Pause / resume / retry:** easily pause the game or start over from the overlay.
  - **No auth, no server:** fully client‑side; just open the HTML file and play.

How to run:
1. Drop these files into a folder (index.html, style.css, main.js).
2. Open `index.html` in a modern browser (mobile supported).
3. Tap/click tiles as they cross the hit line near the bottom.

Storage:
    - High score stored in `localStorage` under key `rhythmRush_highScore`.

Next improvements:

  - Richer sound effects and background music.
  - Combo multipliers and particle effects for satisfying hit feedback.
  - Multiple game modes (e.g. endless, timed, multi‑life).
  - Optional backend for online leaderboards.
  - Enhanced accessibility: colour‑blind themes, haptic feedback and multi‑tap support.

License: MIT
```


```javascript name=main.js
// Magic Tiles - Minimal playable client-side MVP
// No dependencies. Uses canvas and requestAnimationFrame.

(() => {
  // Config
  const COLS = 4;
  const TILE_COLOR = '#111';
  const HIT_COLOR = '#ff3b30';
  const TILE_HEIGHT_RATIO = 0.18; // tile height relative to canvas height
  const BASE_SPEED = 220; // pixels / second (initial)
  const SPEED_INCREASE_RATE = 8; // per 10 seconds
  const INITIAL_SPAWN_INTERVAL = 900; // ms
  const SPAWN_DECAY = 0.98; // multiply interval each difficulty step
  const HIT_WINDOW = 36; // px tolerance around hitLine
  const HIGH_SCORE_KEY = 'magicTiles_highScore';

  // DOM
  const canvas = document.getElementById('gameCanvas');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const pauseBtn = document.getElementById('pauseBtn');
  const startBtn = document.getElementById('startBtn');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');
  const retryBtn = document.getElementById('retryBtn');
  const quitBtn = document.getElementById('quitBtn');

  const ctx = canvas.getContext('2d');

  // Responsive canvas size
  function resizeCanvas() {
    // keep device pixel ratio for crisp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);

  // Game state
  let state = null;

  // Simple audio feedback via WebAudio
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq = 440, time = 0.06, type = 'sine') {
    try {
      ensureAudio();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + time);
      o.stop(audioCtx.currentTime + time + 0.02);
    } catch (e) {
      // ignore if audio blocked
    }
  }

  function loadHighScore() {
    const v = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    return isNaN(v) ? 0 : v;
  }
  function saveHighScore(v) {
    localStorage.setItem(HIGH_SCORE_KEY, String(v));
    highScoreEl.textContent = String(v);
  }

  function newState() {
    return {
      tiles: [], // {id, col, y, hit}
      score: 0,
      highScore: loadHighScore(),
      running: false,
      paused: false,
      gameOver: false,
      lastTime: 0,
      spawnInterval: INITIAL_SPAWN_INTERVAL,
      lastSpawnAt: 0,
      baseSpeed: BASE_SPEED,
      elapsed: 0,
    };
  }

  // Helpers
  function nowMs() { return performance.now(); }
  function randId() { return Math.random().toString(36).slice(2, 9); }

  function spawnTile() {
    const col = Math.floor(Math.random() * COLS);
    const tile = {
      id: randId(),
      col,
      y: -tileHeight(), // start above canvas
      hit: false
    };
    state.tiles.push(tile);
    state.lastSpawnAt = nowMs();
  }

  function tileHeight() {
    return canvas.height / (ctx.getTransform().a || 1) * TILE_HEIGHT_RATIO / (window.devicePixelRatio || 1);
  }

  function columnWidth() {
    const rect = canvas.getBoundingClientRect();
    return rect.width / COLS;
  }

  function hitLineY() {
    // place hit line around 82% of canvas height
    const rect = canvas.getBoundingClientRect();
    return rect.height * 0.82;
  }

  function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;
    state.elapsed += dt / 1000;

    // difficulty scaling: slightly increase speed over time
    const speed = state.baseSpeed + SPEED_INCREASE_RATE * Math.floor(state.elapsed / 10);

    // spawn logic
    if (nowMs() - state.lastSpawnAt > state.spawnInterval) {
      spawnTile();
      // gently decrease spawn interval as difficulty
      state.spawnInterval = Math.max(220, state.spawnInterval * SPAWN_DECAY);
    }

    // move tiles
    for (let t of state.tiles) {
      t.y += speed * (dt / 1000);
    }

    // check passes beyond hit window -> miss -> game over
    const hitY = hitLineY();
    for (let t of state.tiles) {
      if (!t.hit && t.y > hitY + HIT_WINDOW + tileHeight()) {
        // tile passed below the hit window: missed
        doGameOver();
        return;
      }
    }

    // cleanup hit tiles (animated removal could be added)
    state.tiles = state.tiles.filter(t => !t._removed);
  }

  function draw() {
    // clear
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // draw column separators
    const w = rect.width;
    const h = rect.height;
    const colW = w / COLS;
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    for (let i = 1; i < COLS; i++) {
      ctx.fillRect(i * colW - 1, 0, 2, h);
    }

    // draw hit line
    const hitY = hitLineY();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, hitY - 2, w, 4);

    // draw tiles
    const tH = tileHeight();
    for (let t of state.tiles) {
      const x = t.col * colW + 8;
      const tileW = colW - 16;
      const tileH = tH;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(x, t.y + 6, tileW, tileH);

      // main tile
      ctx.fillStyle = t.hit ? HIT_COLOR : TILE_COLOR;
      roundRect(ctx, x, t.y, tileW, tileH, 10, true, false);

      // small gap indicator (makes it feel like a piano tile)
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(x + 6, t.y + 6, tileW - 12, 10);
    }
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') radius = {tl: radius, tr: radius, br: radius, bl: radius};
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function gameLoop(ts) {
    if (!state.lastTime) state.lastTime = ts;
    const dt = ts - state.lastTime;
    state.lastTime = ts;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    state = newState();
    state.running = true;
    state.gameOver = false;
    state.paused = false;
    state.lastTime = 0;
    state.lastSpawnAt = nowMs() + 120; // small delay before first tile
    state.spawnInterval = INITIAL_SPAWN_INTERVAL;
    scoreEl.textContent = '0';
    highScoreEl.textContent = String(state.highScore);
    overlay.classList.add('hidden');
    pauseBtn.textContent = 'Pause';
    playTone(880, 0.04, 'sine');
  }

  function pauseToggle() {
    if (!state || !state.running || state.gameOver) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    if (state.paused) {
      overlayTitle.textContent = 'Paused';
      overlayText.textContent = 'Tap Resume to continue.';
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
      // resume clock
      state.lastTime = 0;
    }
  }

  function doHit(tile) {
    tile.hit = true;
    tile._removed = true;
    state.score += 1;
    playTone(950 - Math.min(400, state.score * 4), 0.06, 'square');
    scoreEl.textContent = String(state.score);
    // update possible high score live
    if (state.score > state.highScore) {
      state.highScore = state.score;
      saveHighScore(state.highScore);
    }
  }

  function doGameOver() {
    if (!state || state.gameOver) return;
    state.gameOver = true;
    state.running = false;
    playTone(160, 0.26, 'sawtooth');
    overlayTitle.textContent = 'Game Over';
    overlayText.textContent = `Score: ${state.score}  •  Best: ${state.highScore}`;
    overlay.classList.remove('hidden');
    // show retry / quit
  }

  // Input handling
  function handlePointer(evt) {
    if (!state || !state.running || state.paused || state.gameOver) return;
    // unify pointer events
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX !== undefined ? evt.clientX : evt.touches[0].clientX) - rect.left;
    const col = Math.floor(x / (rect.width / COLS));
    const hitY = hitLineY();
    // find tile in the same column within hit window
    let found = null;
    for (let t of state.tiles) {
      if (t.col !== col || t.hit) continue;
      const centerY = t.y + tileHeight() / 2;
      if (Math.abs(centerY - hitY) <= HIT_WINDOW) {
        found = t;
        break;
      }
    }
    if (found) {
      doHit(found);
    } else {
      // wrong tap -> game over
      doGameOver();
    }
  }

  // UI wiring
  pauseBtn.addEventListener('click', () => {
    if (!state || state.gameOver || !state.running) return;
    pauseToggle();
  });

  startBtn.addEventListener('click', () => {
    // start from overlay / initial
    startGame();
  });

  retryBtn.addEventListener('click', () => {
    startGame();
  });

  quitBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    // reveal initial title-like overlay
    overlayTitle.textContent = 'Magic Tiles';
    overlayText.textContent = 'Tap Play to begin.';
    overlay.classList.remove('hidden');
    state = null;
  });

  // pointer events on canvas
  canvas.addEventListener('pointerdown', (e) => {
    // ensure audio allowed after user gesture
    ensureAudio();
    handlePointer(e);
  });

  // keyboard: space to start/pause
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!state || state.gameOver || !state.running) startGame();
      else pauseToggle();
    }
  });

  // initial setup
  function init() {
    resizeCanvas();
    state = newState();
    // show initial overlay
    overlayTitle.textContent = 'Magic Tiles';
    overlayText.textContent = 'Tap the tiles as they reach the hit line. Miss or wrong tap ends the game.';
    overlay.classList.remove('hidden');
    // draw loop
    requestAnimationFrame(gameLoop);
    // render initial high score
    highScoreEl.textContent = String(state.highScore);
  }

  // Start
  init();
})();
```

I created a small, self-contained client-side implementation of the Magic Tiles MVP: index.html (UI + canvas), style.css (layout + responsive styling), main.js (game loop, spawn logic, input handling, scoring, localStorage high score), and a README describing how to run and next improvements.

What I did: I implemented a 4-column, single-life gameplay with falling tiles, hit-window detection, immediate game over on wrong taps or missed tiles, pause/resume, live score display, and persistent local high score. The audio uses a minimal WebAudio tone generator so no external assets are required.

What’s next (suggested):
- Add nicer audio/sfx and small visual hit/miss animations.
- Tune difficulty curve (spawn interval, speed) and hit window for best mobile feel.
- Add a simple leaderboard backend if you want online scores (we can sketch endpoints).
- Optionally package into a deployable static site (GitHub Pages).

If you want, I can:
- Push this to a GitHub repo for you (I will create a commit/branch if you give the repo owner/name), or
- Extend the client with combo scoring, improved visuals, and mobile optimizations, or
- Produce a small issue checklist and tasks for GitHub to track remaining polish items.

Tell me which next step you'd like and I’ll proceed.