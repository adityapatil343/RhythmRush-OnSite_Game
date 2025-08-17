// Magic Tiles - Minimal playable client-side MVP
// No dependencies. Uses canvas and requestAnimationFrame.

(() => {
  // Config
  const COLS = 4;
  // Theme colors (should match CSS variables)
  const TILE_COLOR = '#222';
  const HIT_COLOR = '#5e60ce';
  const TILE_HEIGHT_RATIO = 0.18; // tile height relative to canvas height
  const BASE_SPEED = 220; // pixels / second (initial)
  const SPEED_INCREASE_RATE = 8; // per 10 seconds
  const INITIAL_SPAWN_INTERVAL = 900; // ms
  const SPAWN_DECAY = 0.98; // multiply interval each difficulty step
  const HIT_WINDOW = 36; // px tolerance around hitLine
  const HIGH_SCORE_KEY = 'rhythmRush_highScore';

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
  const overlayPlayBtn = document.getElementById('overlayPlayBtn');

  const themeBtn = document.getElementById('themeBtn');
  
  const THEME_KEY = 'rr_theme';
  const themeBtn = document.getElementById('themeBtn');

  // Apply theme and update button label
  function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark', isDark);
  if (themeBtn) themeBtn.textContent = isDark ? 'Theme: Dark' : 'Theme: Light';
  }

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);

  // Toggle theme on button click and persist
  if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    });
  }
  /**
   * Show or hide the pause button based on game state. Only visible when the game is actively running.
   */
  function updateControls() {
    if (!state || !state.running || state.gameOver) {
      pauseBtn.style.display = 'none';
    } else {
      pauseBtn.style.display = '';
    }
  }

  // Wrapper for shake animation
  const gameWrap = document.querySelector('.game-wrap');

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
    return rect.height * 0.65;
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
    // subtle colored hit zone
    ctx.fillStyle = 'rgba(0, 122, 255, 0.12)';
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
    updateControls();
  }

  function pauseToggle() {
    if (!state || state.gameOver || !state.running) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    if (state.paused) {
      overlayTitle.textContent = 'Paused';
      overlayText.innerHTML = '<p>Tap Resume (or press Space) to continue.</p>';
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
      // resume clock
      state.lastTime = 0;
    }
    updateControls();
  }

  function doHit(tile) {
    tile.hit = true;
    // delay removal so the player sees the hit color briefly
    setTimeout(() => {
      tile._removed = true;
    }, 180);
    state.score += 1;
    playTone(950 - Math.min(400, state.score * 4), 0.06, 'square');
    scoreEl.textContent = String(state.score);
    // update possible high score live
    if (state.score > state.highScore) {
      state.highScore = state.score;
      saveHighScore(state.highScore);
      // trigger pulse animation on high score element
      highScoreEl.classList.add('pulse');
      setTimeout(() => highScoreEl.classList.remove('pulse'), 600);
    }
  }

  function doGameOver() {
    if (!state || state.gameOver) return;
    state.gameOver = true;
    state.running = false;
    playTone(160, 0.26, 'sawtooth');
    overlayTitle.textContent = 'Game Over';
    overlayText.innerHTML = `<p>Score: ${state.score}  •  Best: ${state.highScore}</p>`;
    overlay.classList.remove('hidden');
    // show retry / quit
    // shake the game area for feedback
    if (gameWrap) {
      gameWrap.classList.add('shake');
      setTimeout(() => gameWrap.classList.remove('shake'), 400);
    }
    updateControls();
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
    // show instructions again and clear active game
    showInstructions();
    overlay.classList.remove('hidden');
    state = null;
  });

  // New overlay Play button to start the game from the instructions screen
  overlayPlayBtn.addEventListener('click', () => {
    startGame();
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

  // Instruction / overlay content helper
  function showInstructions() {
    overlayTitle.textContent = 'How to Play';
    overlayText.innerHTML = `
      <ul>
        <li><strong>Tap the black tiles</strong> as they cross the gray hit line near the bottom.</li>
        <li><strong>Correct hit</strong> = +1 point. Tiles light up when hit.</li>
        <li><strong>Wrong tap</strong> (tapping where there is no tile) or <strong>missing a tile</strong> ends the game.</li>
        <li>Controls: tap with finger, click with mouse. Press <strong>Space</strong> to start/pause on keyboard.</li>
        <li>Try to beat your best score — it's saved locally in your browser.</li>
      </ul>
    `;
    overlay.classList.remove('hidden');
    updateControls();
  }

  // initial setup
  function init() {
    resizeCanvas();
    state = newState();
    // show initial overlay with instructions
    showInstructions();
    // draw loop
    requestAnimationFrame(gameLoop);
    // render initial high score
    highScoreEl.textContent = String(state.highScore);
    updateControls();

    // Theme toggle
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark');
      });
    }
  }

  // Start
  init();
})();
