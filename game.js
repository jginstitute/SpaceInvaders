// Game variables
let canvas, ctx;
let player, enemies, bullets, powerUps;
let gameLoop, gameState;
let score = 0;
let level = 1;
let lives = 3;
let keys = {};

// Sound effects
let shootSound, explosionSound, powerUpSound;

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

    // Load sound effects
    shootSound = new Audio('shoot.wav');
    explosionSound = new Audio('explosion.wav');
    powerUpSound = new Audio('powerup.wav');

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

        // Render score, level, and lives
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, 10, 30);
        ctx.fillText(`Level: ${level}`, 10, 60);
        ctx.fillText(`Lives: ${lives}`, 10, 90);
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
        enemy.x += Math.sin(enemy.y * 0.1) * 2; // Sine wave movement

        if (enemy.y > canvas.height) {
            enemies = enemies.filter(e => e !== enemy);
        }

        // Randomly fire bullets
        if (Math.random() < 0.001) {
            fireEnemyBullet(enemy);
        }
    });
}

function fireEnemyBullet(enemy) {
    bullets.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height,
        width: 4,
        height: 10,
        speed: -5,
        isEnemyBullet: true
    });
}

function spawnEnemies() {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 8; j++) {
            let enemyType = Math.random() < 0.2 ? 'tough' : 'normal';
            enemies.push({
                x: j * 80 + 50,
                y: i * 50 + 30,
                width: 40,
                height: 30,
                speed: 0.5 + (level * 0.1),
                type: enemyType,
                health: enemyType === 'tough' ? 2 : 1
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
    shootSound.play();
}

function updatePowerUps() {
    if (Math.random() < 0.001) {
        spawnPowerUp();
    }

    powerUps.forEach(powerUp => {
        powerUp.y += powerUp.speed;
        if (powerUp.y > canvas.height) {
            powerUps = powerUps.filter(p => p !== powerUp);
        }
    });
}

function spawnPowerUp() {
    powerUps.push({
        x: Math.random() * (canvas.width - 20),
        y: 0,
        width: 20,
        height: 20,
        speed: 2,
        type: Math.random() < 0.5 ? 'rapidFire' : 'shield'
    });
}

function applyPowerUp(powerUp) {
    if (powerUp.type === 'rapidFire') {
        player.rapidFire = true;
        setTimeout(() => { player.rapidFire = false; }, 5000);
    } else if (powerUp.type === 'shield') {
        player.shield = true;
        setTimeout(() => { player.shield = false; }, 5000);
    }
}

// Collision detection
function checkCollisions() {
    // Check player bullet-enemy collisions
    bullets.filter(bullet => !bullet.isEnemyBullet).forEach(bullet => {
        enemies.forEach(enemy => {
            if (isColliding(bullet, enemy)) {
                bullets = bullets.filter(b => b !== bullet);
                enemy.health--;
                if (enemy.health <= 0) {
                    enemies = enemies.filter(e => e !== enemy);
                    score += enemy.type === 'tough' ? 20 : 10;
                    explosionSound.play();
                }
            }
        });
    });

    // Check enemy bullet-player collisions
    bullets.filter(bullet => bullet.isEnemyBullet).forEach(bullet => {
        if (isColliding(bullet, player)) {
            bullets = bullets.filter(b => b !== bullet);
            if (player.shield) {
                player.shield = false;
            } else {
                loseLife();
            }
        }
    });

    // Check player-enemy collisions
    enemies.forEach(enemy => {
        if (isColliding(player, enemy)) {
            if (player.shield) {
                player.shield = false;
                enemies = enemies.filter(e => e !== enemy);
            } else {
                loseLife();
            }
        }
    });

    // Check player-powerUp collisions
    powerUps.forEach(powerUp => {
        if (isColliding(player, powerUp)) {
            applyPowerUp(powerUp);
            powerUps = powerUps.filter(p => p !== powerUp);
            powerUpSound.play();
        }
    });
}

function loseLife() {
    lives--;
    if (lives <= 0) {
        gameOver();
    } else {
        resetPlayerPosition();
    }
}

function resetPlayerPosition() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 60;
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Rendering functions
function renderPlayer() {
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    if (player.shield) {
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 30, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function renderEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.type === 'tough' ? '#800' : '#f00';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function renderBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.isEnemyBullet ? '#f00' : '#fff';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function renderPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'rapidFire' ? '#ff0' : '#0ff';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
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
    level = 1;
    lives = 3;
    enemies = [];
    bullets = [];
    powerUps = [];
    resetPlayerPosition();
    spawnEnemies();
}

function nextLevel() {
    level++;
    enemies = [];
    bullets = [];
    powerUps = [];
    resetPlayerPosition();
    spawnEnemies();
}

// Initialize the game when the window loads
window.onload = init;
