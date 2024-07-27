// Game variables
let canvas, ctx;
let player, enemies, bullets, powerUps;
let gameLoop, gameState;
let score = 0;
let level = 1;
let lives = 3;
let keys = {};
let lastBulletTime = 0;
const BULLET_COOLDOWN = 250; // 250 milliseconds cooldown between shots
let invulnerableUntil = 0;
const INVULNERABILITY_DURATION = 3000; // 3 seconds of invulnerability
let lastLifeGainScore = 0; // Track the last score at which a life was gained

// Audio elements
let shootSound, explosionSound, powerupSound;

import { initCommentary, updateCommentary, COMMENTARY_PRIORITY } from './commentary.js';

// Settings
let isSettingsOpen = false;
let previousGameState;
let commentaryStyle = 'trashtalk';

// Alien destruction commentary variations have been moved to commentary.js


// Game states
const GAME_STATE = {
    START: 0,
    PLAYING: 1,
    GAME_OVER: 2,
    PAUSED: 3
};

let pauseMessage;

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    gameState = GAME_STATE.START;
    document.getElementById('start-screen').style.display = 'block';

    // Initialize audio elements
    shootSound = document.getElementById('shoot-sound');
    explosionSound = document.getElementById('explosion-sound');
    powerupSound = document.getElementById('powerup-sound');

    // Initialize commentary
    initCommentary();

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

    // Settings
    document.getElementById('settings-icon').addEventListener('click', toggleSettingsPanel);
    document.getElementById('voice-select').addEventListener('change', updateSelectedVoice);
    document.getElementById('commentary-style').addEventListener('change', updateCommentaryStyle);
    document.getElementById('close-settings').addEventListener('click', toggleSettingsPanel);

    // Populate voice options
    populateVoiceOptions();

    // Start the game loop
    gameLoop = requestAnimationFrame(update);
}

// Settings functions
function toggleSettingsPanel() {
    isSettingsOpen = !isSettingsOpen;
    const settingsPanel = document.getElementById('settings-panel');
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    if (isSettingsOpen) {
        settingsPanel.style.display = 'block';
        document.body.appendChild(modalOverlay);
        if (gameState === GAME_STATE.PLAYING) {
            previousGameState = gameState;
            gameState = GAME_STATE.PAUSED;
        }
    } else {
        settingsPanel.style.display = 'none';
        document.body.removeChild(document.querySelector('.modal-overlay'));
        if (previousGameState === GAME_STATE.PLAYING) {
            gameState = GAME_STATE.PLAYING;
            gameLoop = requestAnimationFrame(update);
        }
    }
}

function populateVoiceOptions() {
    const voiceSelect = document.getElementById('voice-select');
    speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = voice.name;
            voiceSelect.appendChild(option);
        });
    };
}

let selectedVoice = 'random';

function updateSelectedVoice() {
    selectedVoice = document.getElementById('voice-select').value;
}

function updateCommentaryStyle() {
    commentaryStyle = document.getElementById('commentary-style').value;
}

// Main game loop
function update() {
    if (gameState === GAME_STATE.PLAYING) {
        // Update game objects
        updatePlayer();
        updateEnemies();
        updateBullets();
        updatePowerUps();

        // Check for bullet firing
        if (keys.Space) {
            fireBullet();
        }

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

        gameLoop = requestAnimationFrame(update);
    } else {
        gameLoop = requestAnimationFrame(update);
    }
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
    const currentTime = Date.now();
    if (currentTime - lastBulletTime >= BULLET_COOLDOWN || player.rapidFire) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 7
        });
        shootSound.play();
        lastBulletTime = currentTime;
    }
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
    const type = Math.random() < 0.5 ? 'rapidFire' : 'shield';
    powerUps.push({
        x: Math.random() * (canvas.width - 20),
        y: 0,
        width: 20,
        height: 20,
        speed: 2,
        type: type
    });
    updateCommentary(`A ${type === 'rapidFire' ? 'Rapid Fire' : 'Shield'} power-up has appeared!`, COMMENTARY_PRIORITY.POWERUP_APPEAR, "POWERUP_APPEAR");
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
    // Check player bullet-enemy collisions and player bullet-powerup collisions
    bullets.filter(bullet => !bullet.isEnemyBullet).forEach(bullet => {
        enemies.forEach(enemy => {
            if (isColliding(bullet, enemy)) {
                bullets = bullets.filter(b => b !== bullet);
                enemy.health--;
                if (enemy.health <= 0) {
                    enemies = enemies.filter(e => e !== enemy);
                    score += enemy.type === 'tough' ? 20 : 10;
                    explosionSound.play();
                    updateCommentary(getRandomAlienDestroyedComment(enemy.type === 'tough'),
                        enemy.type === 'tough' ? COMMENTARY_PRIORITY.ALIEN_DESTROYED_TOUGH : COMMENTARY_PRIORITY.ALIEN_DESTROYED_NORMAL,
                        enemy.type === 'tough' ? "ALIEN_DESTROYED_TOUGH" : "ALIEN_DESTROYED_NORMAL");
                    checkLifeGain(); // Check if player should gain a life after scoring
                }
            }
        });
    
        powerUps.forEach(powerUp => {
            if (isColliding(bullet, powerUp)) {
                bullets = bullets.filter(b => b !== bullet);
                powerUps = powerUps.filter(p => p !== powerUp);
                explosionSound.play();
                updateCommentary(`Power-up destroyed! Be more careful next time!`, COMMENTARY_PRIORITY.POWERUP_DESTROYED, "POWERUP_DESTROYED");
            }
        });
    });

    // Check enemy bullet-player collisions
    if (Date.now() >= invulnerableUntil) {
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
    }

    // Check player-powerUp collisions
    powerUps.forEach(powerUp => {
        if (isColliding(player, powerUp)) {
            applyPowerUp(powerUp);
            powerUps = powerUps.filter(p => p !== powerUp);
            powerupSound.play();
            updateCommentary(`${powerUp.type === 'rapidFire' ? 'Rapid Fire' : 'Shield'} power-up collected!`, 
                powerUp.type === 'rapidFire' ? COMMENTARY_PRIORITY.POWERUP_COLLECT_RAPID_FIRE : COMMENTARY_PRIORITY.POWERUP_COLLECT_SHIELD,
                powerUp.type === 'rapidFire' ? "POWERUP_COLLECT_RAPID_FIRE" : "POWERUP_COLLECT_SHIELD");
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

    if (player.shield || Date.now() < invulnerableUntil) {
        ctx.strokeStyle = player.shield ? '#0ff' : '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 30, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Make the player blink when invulnerable
    if (Date.now() < invulnerableUntil && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    } else {
        ctx.globalAlpha = 1;
    }
}

function renderEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.type === 'tough' ? '#f00' : '#0f0';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 8, 8);
        ctx.fillRect(enemy.x + enemy.width - 16, enemy.y + 8, 8, 8);
        
        // Draw mouth
        if (enemy.type === 'tough') {
            ctx.beginPath();
            ctx.moveTo(enemy.x + 8, enemy.y + enemy.height - 8);
            ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height - 4);
            ctx.lineTo(enemy.x + enemy.width - 8, enemy.y + enemy.height - 8);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(enemy.x + 8, enemy.y + enemy.height - 8, enemy.width - 16, 4);
        }
        
        // Draw 'armor' for tough aliens
        if (enemy.type === 'tough') {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height - 4);
        }
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
    if (e.code === 'Escape') {
        togglePause();
    }
    if (e.code === 'Space') {
        if (gameState === GAME_STATE.START) {
            startGame();
        } else if (gameState === GAME_STATE.GAME_OVER) {
            restartGame();
        }
    }
}

function handleKeyUp(e) {
    keys[e.code] = false;
}

function togglePause() {
    if (gameState === GAME_STATE.PLAYING) {
        gameState = GAME_STATE.PAUSED;
        pauseMessage = createPauseMessage();
        updateCommentary("Game paused. Press ESC to resume.", COMMENTARY_PRIORITY.GAME_PAUSED, "GAME_PAUSED");
    } else if (gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
        document.getElementById('game-container').removeChild(pauseMessage);
        updateCommentary("Game resumed. Good luck!", COMMENTARY_PRIORITY.GAME_RESUMED, "GAME_RESUMED");
        gameLoop = requestAnimationFrame(update);
    }
}

function createPauseMessage() {
    const message = document.createElement('div');
    message.textContent = 'PAUSED';
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.fontSize = '48px';
    message.style.color = '#fff';
    message.style.fontWeight = 'bold';
    document.getElementById('game-container').appendChild(message);
    return message;
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
    if (gameState === GAME_STATE.START) {
        gameState = GAME_STATE.PLAYING;
        document.getElementById('start-screen').style.display = 'none';
        canvas.style.cursor = 'none';
        
        // Spawn enemies when the game starts
        spawnEnemies();
        updateCommentary("Game started! Good luck, pilot!", COMMENTARY_PRIORITY.GAME_START, "GAME_START");
    }
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('final-score').textContent = score;
    canvas.style.cursor = 'default';
    resetPowerUps();
    updateCommentary(`Game over! Final score: ${score}. Great effort!`, COMMENTARY_PRIORITY.GAME_OVER, "GAME_OVER");
    
    // Disable settings icon
    document.getElementById('settings-icon').style.pointerEvents = 'none';
}

function restartGame() {
    if (gameState === GAME_STATE.GAME_OVER) {
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
        updateCommentary("Game restarted! Let's try again!", COMMENTARY_PRIORITY.GAME_RESTART, "GAME_RESTART");
        
        // Re-enable settings icon
        document.getElementById('settings-icon').style.pointerEvents = 'auto';
    }
}


function loseLife() {
    lives--;
    if (lives <= 0) {
        gameOver();
    } else {
        resetPlayerPosition();
        invulnerableUntil = Date.now() + INVULNERABILITY_DURATION;
        const messages = [
            `Ouch! That's gotta hurt. Lives remaining: ${lives}.`,
            `Watch out! You've lost a life. ${lives} left.`,
            `Close call! You have ${lives} lives remaining.`,
            `Shields down! ${lives} lives left. Stay focused!`
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        updateCommentary(`${randomMessage}`, COMMENTARY_PRIORITY.LOSE_LIFE, "LOSE_LIFE");
    }
}

function applyPowerUp(powerUp) {
    if (powerUp.type === 'rapidFire') {
        player.rapidFire = true;
        clearTimeout(player.rapidFireTimeout);
        player.rapidFireTimeout = setTimeout(() => { player.rapidFire = false; }, 5000);
        updateCommentary("Rapid fire activated! Shoot 'em up!", COMMENTARY_PRIORITY.POWERUP_COLLECT_RAPID_FIRE, "POWERUP_COLLECT_RAPID_FIRE");
    } else if (powerUp.type === 'shield') {
        player.shield = true;
        clearTimeout(player.shieldTimeout);
        player.shieldTimeout = setTimeout(() => { player.shield = false; }, 5000);
        updateCommentary("Shield activated! You're invincible... for now!", COMMENTARY_PRIORITY.POWERUP_COLLECT_SHIELD, "POWERUP_COLLECT_SHIELD");
    }
}

function resetPowerUps() {
    player.rapidFire = false;
    player.shield = false;
    clearTimeout(player.rapidFireTimeout);
    clearTimeout(player.shieldTimeout);
}

function checkLifeGain() {
    if (score - lastLifeGainScore >= 1000) {
        lives++;
        lastLifeGainScore = Math.floor(score / 1000) * 1000;
        const messages = [
            `Fantastic! You've earned an extra life! Lives: ${lives}`,
            `Incredible score! Extra life awarded! Lives: ${lives}`,
            `Your stellar performance just earned you an extra life! Lives: ${lives}`,
            `Amazing! You've secured an additional life! Lives: ${lives}`
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        updateCommentary(randomMessage, 7, "GAIN_LIFE");
    }
}

function nextLevel() {
    level++;
    enemies = [];
    bullets = [];
    powerUps = [];
    resetPlayerPosition();
    resetPowerUps();
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

    updateCommentary(`Level ${level} started! Enemies are getting faster!`, COMMENTARY_PRIORITY.LEVEL_UP, "LEVEL_UP");
}

// This section has been moved to commentary.js

// Initialize the game when the window loads
window.onload = init;
