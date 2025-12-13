// Ambulance Chase Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 30;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const COINS_PER_POINT = 4; // 4 pièces = 1 point

// Game state
let gameState = {
    player: { x: 1, y: 1, dir: 'right' },
    enemies: [],
    coins: [],
    coinsCollected: 0,
    score: 0,
    gameOver: false,
    bestScore: parseInt(document.getElementById('best-score').textContent) || 0,
    lastSpawnTime: 0,
    spawnInterval: 10000 // Spawn new enemy every 10 seconds
};

// Maze layout (1 = wall, 0 = path)
const maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Initialize game
function init() {
    // Place coins on all empty tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (maze[y][x] === 0 && !(x === 1 && y === 1)) {
                gameState.coins.push({ x, y });
            }
        }
    }

    // Create enemies (tow trucks) - 8 for more difficulty
    gameState.enemies = [
        { x: 18, y: 1, dir: 'left', color: '#ff6b3d' },
        { x: 1, y: 18, dir: 'right', color: '#ff8c42' },
        { x: 18, y: 18, dir: 'left', color: '#ffa500' },
        { x: 10, y: 1, dir: 'down', color: '#ff4500' },
        { x: 1, y: 10, dir: 'right', color: '#ff6347' },
        { x: 18, y: 10, dir: 'left', color: '#ff7f50' },
        { x: 10, y: 18, dir: 'up', color: '#ff8c69' },
        { x: 5, y: 5, dir: 'right', color: '#ffa07a' }
    ];

    updateCoinsDisplay();
    setupControls();
    gameState.lastSpawnTime = Date.now();
    gameLoop();
}

// Spawn a new enemy at a random empty corner
function spawnNewEnemy() {
    const colors = ['#ff6b3d', '#ff8c42', '#ffa500', '#ff4500', '#ff6347', '#ff7f50', '#ff8c69', '#ffa07a'];
    const corners = [
        { x: 1, y: 1 },
        { x: 18, y: 1 },
        { x: 1, y: 18 },
        { x: 18, y: 18 }
    ];

    // Find a corner that's not occupied by player
    const availableCorners = corners.filter(c =>
        !(c.x === gameState.player.x && c.y === gameState.player.y)
    );

    if (availableCorners.length > 0) {
        const spawn = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        const color = colors[gameState.enemies.length % colors.length];

        gameState.enemies.push({
            x: spawn.x,
            y: spawn.y,
            dir: 'right',
            color: color
        });
    }
}

// Setup keyboard and touch controls
function setupControls() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (gameState.gameOver) return;

        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        if (keyMap[e.key]) {
            e.preventDefault();
            movePlayer(keyMap[e.key]);
        }
    });

    // Touch controls
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!gameState.gameOver) {
                movePlayer(btn.dataset.dir);
            }
        });
    });
}

// Move player
function movePlayer(dir) {
    const moves = {
        'up': { x: 0, y: -1 },
        'down': { x: 0, y: 1 },
        'left': { x: -1, y: 0 },
        'right': { x: 1, y: 0 }
    };

    const move = moves[dir];
    const newX = gameState.player.x + move.x;
    const newY = gameState.player.y + move.y;

    // Check wall collision
    if (maze[newY] && maze[newY][newX] === 0) {
        gameState.player.x = newX;
        gameState.player.y = newY;
        gameState.player.dir = dir;

        // Check collision with enemies IMMEDIATELY after moving
        const hitEnemy = gameState.enemies.some(enemy =>
            enemy.x === newX && enemy.y === newY
        );

        if (hitEnemy) {
            endGame(false);
            return;
        }

        // Check coin collection
        const coinIndex = gameState.coins.findIndex(c => c.x === newX && c.y === newY);
        if (coinIndex !== -1) {
            gameState.coins.splice(coinIndex, 1);
            gameState.coinsCollected++;

            // Calculate score: 4 coins = 1 point
            gameState.score = Math.floor(gameState.coinsCollected / COINS_PER_POINT);

            updateScore();
            updateCoinsDisplay();

            // Win condition
            if (gameState.coins.length === 0) {
                endGame(true);
            }
        }
    }
}

// Move enemies (simple AI)
function moveEnemies() {
    gameState.enemies.forEach(enemy => {
        // Simple pathfinding: move towards player
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;

        let newX = enemy.x;
        let newY = enemy.y;

        // Prioritize larger distance
        if (Math.abs(dx) > Math.abs(dy)) {
            newX += Math.sign(dx);
        } else {
            newY += Math.sign(dy);
        }

        // Check if move is valid
        if (maze[newY] && maze[newY][newX] === 0) {
            enemy.x = newX;
            enemy.y = newY;
        } else {
            // Try alternative direction
            if (Math.abs(dx) > Math.abs(dy)) {
                newY = enemy.y + Math.sign(dy);
                newX = enemy.x;
            } else {
                newX = enemy.x + Math.sign(dx);
                newY = enemy.y;
            }

            if (maze[newY] && maze[newY][newX] === 0) {
                enemy.x = newX;
                enemy.y = newY;
            }
        }

        // Check collision with player
        if (enemy.x === gameState.player.x && enemy.y === gameState.player.y) {
            endGame(false);
        }
    });
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    ctx.fillStyle = '#2d2d44';
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (maze[y][x] === 1) {
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw coins
    gameState.coins.forEach(coin => {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(
            coin.x * TILE_SIZE + TILE_SIZE / 2,
            coin.y * TILE_SIZE + TILE_SIZE / 2,
            4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Draw player (ambulance)
    ctx.fillStyle = '#ff6b3d';
    ctx.fillRect(
        gameState.player.x * TILE_SIZE + 2,
        gameState.player.y * TILE_SIZE + 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4
    );
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚑',
        gameState.player.x * TILE_SIZE + TILE_SIZE / 2,
        gameState.player.y * TILE_SIZE + TILE_SIZE / 2
    );

    // Draw enemies (tow trucks)
    gameState.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(
            enemy.x * TILE_SIZE + 2,
            enemy.y * TILE_SIZE + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4
        );
        ctx.fillStyle = '#fff';
        ctx.fillText('🚚',
            enemy.x * TILE_SIZE + TILE_SIZE / 2,
            enemy.y * TILE_SIZE + TILE_SIZE / 2
        );
    });
}

// Update score display
function updateScore() {
    document.getElementById('current-score').textContent = gameState.score;
}

function updateCoinsDisplay() {
    document.getElementById('coins-left').textContent = gameState.coins.length;
}

// Game loop
let lastEnemyMove = 0;
function gameLoop() {
    if (gameState.gameOver) return;

    draw();

    const now = Date.now();

    // Move enemies every 500ms
    if (now - lastEnemyMove > 500) {
        moveEnemies();
        lastEnemyMove = now;
    }

    // Spawn new enemy every 10 seconds
    if (now - gameState.lastSpawnTime > gameState.spawnInterval) {
        spawnNewEnemy();
        gameState.lastSpawnTime = now;
    }

    requestAnimationFrame(gameLoop);
}

// End game
async function endGame(won) {
    gameState.gameOver = true;

    // Save score
    try {
        const res = await fetch('/api/ambulance/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: gameState.score })
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById('best-score').textContent = data.best_score;
        }
    } catch (e) {
        console.error('Failed to save score:', e);
    }

    // Show game over screen
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('game-over').classList.add('show');
}

// Start game
init();
