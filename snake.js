(() => {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const TICK_MS = 120;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreValue = document.getElementById("scoreValue");
  const statusOverlay = document.getElementById("statusOverlay");
  const statusText = document.getElementById("statusText");
  const restartBtn = document.getElementById("restartBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const dirButtons = document.querySelectorAll(".dir");

  const COLORS = {
    board: "#2b2b2b",
    grid: "#3a3a3a",
    snake: "#3bb273",
    snakeHead: "#2a8a5a",
    food: "#e34f4f",
  };

  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const OPPOSITES = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  function randomInt(max, rng = Math.random) {
    return Math.floor(rng() * max);
  }

  function createInitialSnake() {
    return [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
  }

  function createGameState(rng = Math.random) {
    const snake = createInitialSnake();
    return {
      snake,
      direction: "right",
      pendingDirection: "right",
      food: placeFood(snake, rng),
      score: 0,
      gameOver: false,
      paused: false,
      rng,
    };
  }

  function placeFood(snake, rng) {
    let position = null;
    const occupied = new Set(snake.map((part) => `${part.x},${part.y}`));
    while (!position) {
      const x = randomInt(GRID_SIZE, rng);
      const y = randomInt(GRID_SIZE, rng);
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        position = { x, y };
      }
    }
    return position;
  }

  function setDirection(state, nextDirection) {
    if (OPPOSITES[state.direction] === nextDirection) {
      return;
    }
    state.pendingDirection = nextDirection;
  }

  function step(state) {
    if (state.gameOver || state.paused) {
      return state;
    }

    state.direction = state.pendingDirection;

    const head = state.snake[0];
    const vector = DIRECTIONS[state.direction];
    const next = { x: head.x + vector.x, y: head.y + vector.y };

    const hitWall =
      next.x < 0 || next.y < 0 || next.x >= GRID_SIZE || next.y >= GRID_SIZE;
    const hitSelf = state.snake.some(
      (part, index) => index !== 0 && part.x === next.x && part.y === next.y
    );

    if (hitWall || hitSelf) {
      state.gameOver = true;
      return state;
    }

    state.snake.unshift(next);

    const ateFood = next.x === state.food.x && next.y === state.food.y;
    if (ateFood) {
      state.score += 1;
      state.food = placeFood(state.snake, state.rng);
    } else {
      state.snake.pop();
    }

    return state;
  }

  function draw(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        ctx.fillStyle = COLORS.board;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    ctx.fillStyle = COLORS.food;
    ctx.fillRect(
      state.food.x * CELL_SIZE,
      state.food.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    );

    state.snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snake;
      ctx.fillRect(
        part.x * CELL_SIZE,
        part.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    });
  }

  function updateUI(state) {
    scoreValue.textContent = String(state.score);
    if (state.gameOver) {
      statusText.textContent = "Game Over";
      statusOverlay.hidden = false;
    } else if (state.paused) {
      statusText.textContent = "Paused";
      statusOverlay.hidden = false;
    } else {
      statusOverlay.hidden = true;
    }
    pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  }

  let state = createGameState();
  let timerId = null;

  function resetGame() {
    state = createGameState(state.rng);
    updateUI(state);
    draw(state);
  }

  function togglePause() {
    if (state.gameOver) {
      return;
    }
    state.paused = !state.paused;
    updateUI(state);
  }

  function gameTick() {
    step(state);
    draw(state);
    updateUI(state);
  }

  function startLoop() {
    if (timerId) {
      clearInterval(timerId);
    }
    timerId = setInterval(gameTick, TICK_MS);
  }

  function handleKey(event) {
    const key = event.key.toLowerCase();
    if (key === "arrowup" || key === "w") setDirection(state, "up");
    if (key === "arrowdown" || key === "s") setDirection(state, "down");
    if (key === "arrowleft" || key === "a") setDirection(state, "left");
    if (key === "arrowright" || key === "d") setDirection(state, "right");
    if (key === " ") togglePause();
  }

  document.addEventListener("keydown", handleKey);

  dirButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dir = button.dataset.dir;
      setDirection(state, dir);
    });
  });

  restartBtn.addEventListener("click", () => {
    resetGame();
  });

  resetBtn.addEventListener("click", () => {
    resetGame();
  });

  pauseBtn.addEventListener("click", () => {
    togglePause();
  });

  draw(state);
  updateUI(state);
  startLoop();

  // Expose deterministic logic for optional testing.
  window.SnakeGame = {
    createGameState,
    step,
    setDirection,
    placeFood,
  };
})();
