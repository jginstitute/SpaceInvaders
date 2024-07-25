// Game variables
let canvas, ctx;
let player, enemies, bullets, powerUps;
let gameLoop, gameState;
let score = 0;
let keys = {};

// Game states
const GAME_STATE = {
    START: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    gameState = GAME_STATE.START;

    // Initialize game objects
    player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 30,
        speed: 5
    };

    enemies = [];
    bullets = [];
    powerUps = [];

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);

    // Start the game loop
    gameLoop = requestAnimationFrame(update);
}

// Main game loop
function update() {
    if (gameState === GAME_STATE.PLAYING) {
        // Update game objects
        updatePlayer();
        updateEnemies();
        updateBullets();
        updatePowerUps();

        // Check collisions
        checkCollisions();

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render game objects
        renderPlayer();
        renderEnemies();
        renderBullets();
        renderPowerUps();

        // Render score
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, 10, 30);
    }

    gameLoop = requestAnimationFrame(update);
}

// Game object update functions
function updatePlayer() {
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

function updateEnemies() {
    if (enemies.length === 0) {
        spawnEnemies();
    }

    enemies.forEach(enemy => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) {
            enemies = enemies.filter(e => e !== enemy);
        }
    });
}

function spawnEnemies() {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 8; j++) {
            enemies.push({
                x: j * 80 + 50,
                y: i * 50 + 30,
                width: 40,
                height: 30,
                speed: 0.5
            });
        }
    }
}

function updateBullets() {
    bullets.forEach(bullet => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets = bullets.filter(b => b !== bullet);
        }
    });
}

function fireBullet() {
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 7
    });
}

function updatePowerUps() {
    // Power-up spawning and movement logic here
}

// Collision detection
function checkCollisions() {
    // Collision detection logic here
}

// Rendering functions
function renderPlayer() {
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function renderEnemies() {
    ctx.fillStyle = '#f00';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function renderBullets() {
    ctx.fillStyle = '#fff';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function renderPowerUps() {
    // Render power-ups here
}

// Input handling
function handleKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState === GAME_STATE.PLAYING) {
        fireBullet();
    }
}

function handleKeyUp(e) {
    keys[e.code] = false;
}

// Game state functions
function startGame() {
    gameState = GAME_STATE.PLAYING;
    document.getElementById('start-screen').style.display = 'none';
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('final-score').textContent = score;
}

function restartGame() {
    gameState = GAME_STATE.PLAYING;
    document.getElementById('game-over-screen').style.display = 'none';
    // Reset game variables and start a new game
    score = 0;
    // Reset other game objects here
}

// Initialize the game when the window loads
window.onload = init;
