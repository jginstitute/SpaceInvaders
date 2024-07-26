// Game variables
let canvas, ctx;
let player, enemies, bullets, powerUps;
let gameLoop, gameState;
let score = 0;
let level = 1;
let lives = 3;
let keys = {};

// Audio elements
let shootSound, explosionSound, powerupSound;

// Commentary
let commentaryElement;
let lastCommentaryTime = 0;
const COMMENTARY_COOLDOWN = 3000; // 3 seconds cooldown between comments


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

    // Initialize audio elements
    shootSound = document.getElementById('shoot-sound');
    explosionSound = document.getElementById('explosion-sound');
    powerupSound = document.getElementById('powerup-sound');

    // Initialize commentary element
    commentaryElement = document.getElementById('commentary');

    // Initialize game objects
    player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 30,
        speed: 4
    };

    enemies = [];
    bullets = [];
    powerUps = [];

    // Web Audio will be initialized when the game starts

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

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

        // Update game info
        document.getElementById('score').textContent = `Score: ${score}`;
        document.getElementById('level').textContent = `Level: ${level}`;
        document.getElementById('lives').textContent = `Lives: ${lives}`;
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
        nextLevel();
    }

    let moveDown = false;
    enemies.forEach(enemy => {
        enemy.x += enemy.speed;
        
        // Check if any enemy has reached the edge
        if (enemy.x < 0 || enemy.x + enemy.width > canvas.width) {
            moveDown = true;
        }

        // Randomly fire bullets
        if (Math.random() < enemy.fireRate) {
            fireEnemyBullet(enemy);
        }
    });

    if (moveDown) {
        enemies.forEach(enemy => {
            enemy.y += 20; // Move down by 20 pixels
            enemy.speed = -enemy.speed; // Reverse direction
        });
    }

    // Check if any enemy has reached the bottom
    enemies.forEach(enemy => {
        if (enemy.y + enemy.height > canvas.height) {
            enemies = enemies.filter(e => e !== enemy);
            loseLife();
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
    const rows = Math.min(3 + Math.floor(level / 2), 8);
    const cols = Math.min(6 + Math.floor(level / 2), 12);
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let enemyType = Math.random() < 0.1 + (level * 0.03) ? 'tough' : 'normal';
            enemies.push({
                x: j * 60 + 50,
                y: i * 50 + 30,
                width: 40,
                height: 24,
                speed: 0.5 + (level * 0.1),
                type: enemyType,
                health: enemyType === 'tough' ? 2 : 1,
                fireRate: 0.001 + (level * 0.0002)
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
            powerupSound.play();
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
    ctx.fillStyle = '#0f0';  // Change color to green like the original
    
    // Draw the base of the ship
    ctx.fillRect(player.x, player.y + player.height - 10, player.width, 10);
    
    // Draw the triangular top of the ship
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height - 10);
    ctx.lineTo(player.x + player.width, player.y + player.height - 10);
    ctx.closePath();
    ctx.fill();

    // Draw a small rectangle for the "cannon"
    ctx.fillRect(player.x + player.width / 2 - 2, player.y - 5, 4, 5);

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
        ctx.fillStyle = '#0f0';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 8, 8);
        ctx.fillRect(enemy.x + enemy.width - 16, enemy.y + 8, 8, 8);
        
        // Draw mouth
        ctx.fillRect(enemy.x + 8, enemy.y + enemy.height - 8, enemy.width - 16, 4);
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

function handleMouseEnter() {
    if (gameState === GAME_STATE.PLAYING) {
        canvas.style.cursor = 'none';
    }
}

function handleMouseLeave() {
    canvas.style.cursor = 'default';
}

// Game state functions
function startGame() {
    gameState = GAME_STATE.PLAYING;
    document.getElementById('start-screen').style.display = 'none';
    canvas.style.cursor = 'none';
    
    // Spawn enemies when the game starts
    spawnEnemies();
    updateCommentary("Game started! Good luck, pilot!");
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('final-score').textContent = score;
    canvas.style.cursor = 'default';
    updateCommentary(`Game over! Final score: ${score}. Great effort!`);
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
    updateCommentary("Game restarted! Let's try again!");
}

function loseLife() {
    lives--;
    if (lives <= 0) {
        gameOver();
    } else {
        resetPlayerPosition();
        updateCommentary(`Ouch! Lives remaining: ${lives}. Be careful!`);
    }
}

function applyPowerUp(powerUp) {
    if (powerUp.type === 'rapidFire') {
        player.rapidFire = true;
        setTimeout(() => { player.rapidFire = false; }, 5000);
        updateCommentary("Rapid fire activated! Shoot 'em up!");
    } else if (powerUp.type === 'shield') {
        player.shield = true;
        setTimeout(() => { player.shield = false; }, 5000);
        updateCommentary("Shield activated! You're invincible... for now!");
    }
}

function nextLevel() {
    level++;
    enemies = [];
    bullets = [];
    powerUps = [];
    resetPlayerPosition();
    spawnEnemies();
    
    // Increase player speed slightly
    player.speed = Math.min(player.speed + 0.2, 8);
    
    // Increase enemy movement speed
    enemies.forEach(enemy => {
        enemy.speed *= 1.1;
    });
    
    // Display level up message
    const levelUpMessage = document.createElement('div');
    levelUpMessage.textContent = `Level ${level}`;
    levelUpMessage.style.position = 'absolute';
    levelUpMessage.style.top = '50%';
    levelUpMessage.style.left = '50%';
    levelUpMessage.style.transform = 'translate(-50%, -50%)';
    levelUpMessage.style.fontSize = '48px';
    levelUpMessage.style.color = '#fff';
    document.getElementById('game-container').appendChild(levelUpMessage);
    
    setTimeout(() => {
        document.getElementById('game-container').removeChild(levelUpMessage);
    }, 2000);

    updateCommentary(`Level ${level} started! Enemies are getting faster!`);
}

function updateCommentary(message) {
    const currentTime = Date.now();
    if (currentTime - lastCommentaryTime >= COMMENTARY_COOLDOWN) {
        commentaryElement.textContent = message;
        lastCommentaryTime = currentTime;
    }
}

// Initialize the game when the window loads
window.onload = init;
