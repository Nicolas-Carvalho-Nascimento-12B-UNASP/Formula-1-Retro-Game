const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const redFlag = document.getElementById('redFlag');
const scoreDisplay = document.getElementById('score');
const shieldTimerDisplay = document.getElementById('shieldTimer');

let car, track, opponents, gameOver, score, shieldActive, shieldEndTime;
let lastTime = 0;
let speedIncrementInterval, opponentCreationInterval, shieldCreationInterval, shieldTimerInterval;
let isAccelerating = false;
let isDecelerating = false;
let isPaused = false;

const images = {
    track: new Image(),
    playerCar: new Image(),
    opponentCar: new Image(),
    shield: new Image()
};

images.track.src = 'images/track.png';
images.playerCar.src = 'images/player-car.png';
images.opponentCar.src = 'images/opponent-car.png';
images.shield.src = 'images/shield.png';

// Initialize game once track image is loaded
images.track.onload = function() {
    initializeGame();
    restartButton.style.display = 'none';
    redFlag.style.display = 'none';
    startIntervals();
    requestAnimationFrame(gameLoop);
};

// Initialize game variables and state
function initializeGame() {
    car = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 150,
        width: 50,
        height: 100,
        speed: 0,
        maxSpeed: 10,
        accelerationRate: 0.1,
        decelerationRate: 0.05,
        quickDecelerationRate: 0.3,
        lateralSpeed: 8,
        movingLeft: false,
        movingRight: false,
        shielded: false
    };

    track = {
        width: 300,
        height: 1000,
        position: 0,
        normalSpeed: 5,
        currentSpeed: 5
    };

    opponents = [];
    shieldActive = false;
    shieldEndTime = 0;
    gameOver = false;
    lastTime = 0;
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    shieldTimerDisplay.textContent = `Shield Duration: 0`;
}

// Start game intervals
function startIntervals() {
    if (!speedIncrementInterval) {
        speedIncrementInterval = setInterval(increaseSpeed, 1000);
    }
    if (!opponentCreationInterval) {
        opponentCreationInterval = setInterval(createOpponent, 2000);
    }
    if (!shieldCreationInterval) {
        shieldCreationInterval = setInterval(createShield, 15000);
    }
}

// Stop game intervals
function stopIntervals() {
    clearInterval(speedIncrementInterval);
    clearInterval(opponentCreationInterval);
    clearInterval(shieldCreationInterval);
    clearInterval(shieldTimerInterval);
    speedIncrementInterval = null;
    opponentCreationInterval = null;
    shieldCreationInterval = null;
    shieldTimerInterval = null;
}

// Increase track and opponent speed
function increaseSpeed() {
    track.normalSpeed += 0.1;
    for (let opponent of opponents) {
        opponent.speed += 0.1;
    }
}

// Create an opponent car
function createOpponent() {
    const x = Math.random() * (track.width - 50) + (canvas.width - track.width) / 2;
    const y = -100;
    const speed = track.currentSpeed + 2;
    const movingLateral = Math.random() < 0.3;
    const lateralSpeed = Math.random() * 2 + 1;
    opponents.push({ x, y, width: 50, height: 100, speed, movingLateral, direction: Math.random() < 0.5 ? -1 : 1, lateralSpeed });
}

// Create a shield power-up
function createShield() {
    const x = Math.random() * (track.width - 50) + (canvas.width - track.width) / 2;
    const y = -100;
    opponents.push({ x, y, width: 50, height: 50, type: 'shield', speed: track.currentSpeed });
}

// Detect collision between two rectangles
function detectCollision(rect1, rect2) {
    return rect1.x + 1 < rect2.x + rect2.width - 1 &&
           rect1.x + rect1.width - 1 > rect2.x + 1 &&
           rect1.y + 1 < rect2.y + rect2.height - 1 &&
           rect1.height + rect1.y - 1 > rect2.y + 1;
}

// Check for collisions between player car and opponents
function checkCollisions() {
    for (let i = opponents.length - 1; i >= 0; i--) {
        let opponent = opponents[i];
        if (detectCollision(car, opponent)) {
            if (opponent.type === 'shield') {
                activateShield();
                opponents.splice(i, 1); // Remove shield after collection
            } else if (!car.shielded) {
                gameOver = true;
                restartButton.style.display = 'block';
                redFlag.style.display = 'block';
                stopIntervals();
                return;
            }
        }
    }
}

// Activate shield for player car
function activateShield() {
    car.shielded = true;
    shieldActive = true;
    shieldEndTime = Date.now() + 5000; // Shield lasts for 5 seconds
    shieldTimerInterval = setInterval(updateShieldTimer, 100);
    setTimeout(deactivateShield, 5000); // Deactivate shield after 5 seconds
}

// Deactivate shield for player car
function deactivateShield() {
    car.shielded = false;
    shieldActive = false;
    clearInterval(shieldTimerInterval);
    shieldTimerDisplay.textContent = `Shield Duration: 0`;
}

// Update shield timer display
function updateShieldTimer() {
    const remainingTime = Math.max(0, shieldEndTime - Date.now());
    shieldTimerDisplay.textContent = `Shield Duration: ${(remainingTime / 1000).toFixed(1)}`;
}

// Update game state
function update(deltaTime) {
    if (gameOver || isPaused) return;

    // Update car speed based on acceleration/deceleration
    if (isAccelerating) {
        if (car.speed < car.maxSpeed) {
            car.speed += car.accelerationRate;
        }
    } else if (isDecelerating) {
        if (car.speed > 0) {
            car.speed -= car.quickDecelerationRate;
        }
    } else {
        if (car.speed > 0) {
            car.speed -= car.decelerationRate;
        }
    }

    if (car.speed < 0) car.speed = 0; // Ensure speed does not become negative

    // Update track speed based on car speed
    track.currentSpeed = track.normalSpeed + car.speed;

    // Update car position based on lateral movement
    if (car.movingLeft && car.x > (canvas.width - track.width) / 2) car.x -= car.lateralSpeed * deltaTime / 16;
    if (car.movingRight && car.x + car.width < (canvas.width + track.width) / 2) car.x += car.lateralSpeed * deltaTime / 16;

    // Update track position for scrolling effect
    track.position += track.currentSpeed * deltaTime / 16;
    if (track.position >= track.height) {
        track.position = 0;
    }

    // Update opponent positions and check for lateral movement
    for (let opponent of opponents) {
        opponent.y += opponent.speed * deltaTime / 16;
        if (opponent.movingLateral) {
            opponent.x += opponent.lateralSpeed * opponent.direction * deltaTime / 16;
            if (opponent.x <= (canvas.width - track.width) / 2 || opponent.x + opponent.width >= (canvas.width + track.width) / 2) {
                opponent.direction *= -1;
            }
        }
    }

    // Remove opponents that have passed the player and increase score
    opponents = opponents.filter(opponent => {
        if (opponent.y >= canvas.height) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            return false;
        }
        return true;
    });

    checkCollisions();
}

// Draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw track
    ctx.drawImage(images.track, (canvas.width - track.width) / 2, track.position - track.height, track.width, track.height);
    ctx.drawImage(images.track, (canvas.width - track.width) / 2, track.position, track.width, track.height);

    // Draw shield if active
    if (shieldActive) {
        ctx.drawImage(images.shield, car.x - 10, car.y - 10, car.width + 20, car.height + 20);
    }

    // Draw player car
    ctx.drawImage(images.playerCar, car.x, car.y, car.width, car.height);

    // Draw opponents and shields
    for (let opponent of opponents) {
        if (opponent.type === 'shield') {
            ctx.drawImage(images.shield, opponent.x, opponent.y, opponent.width, opponent.height);
        } else {
            ctx.drawImage(images.opponentCar, opponent.x, opponent.y, opponent.width, opponent.height);
        }
    }
}

// Main game loop
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (!isPaused) {
        update(deltaTime);
        draw();
        if (!gameOver) {
            requestAnimationFrame(gameLoop);
        }
    }
}

// Restart game
restartButton.addEventListener('click', () => {
    initializeGame();
    restartButton.style.display = 'none';
    redFlag.style.display = 'none';
    startIntervals();
    requestAnimationFrame(gameLoop);
});

// Handle keydown events for car control
document.addEventListener('keydown', function(event) {
    if(event.key === 'ArrowLeft') car.movingLeft = true;
    if(event.key === 'ArrowRight') car.movingRight = true;
    if(event.key === 'ArrowUp') {
        isAccelerating = true;
    }
    if(event.key === 'ArrowDown') {
        isDecelerating = true;
    }
});

// Handle keyup events for car control
document.addEventListener('keyup', function(event) {
    if(event.key === 'ArrowLeft') car.movingLeft = false;
    if(event.key === 'ArrowRight') car.movingRight = false;
    if(event.key === 'ArrowUp') {
        isAccelerating = false;
    }
    if(event.key === 'ArrowDown') {
        isDecelerating = false;
    }
});

// Pause and resume game on visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        isPaused = true;
        stopIntervals();
    } else {
        isPaused = false;
        startIntervals();
        requestAnimationFrame(gameLoop);
    }
});