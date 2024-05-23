const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const redFlag = document.getElementById('redFlag');

let car, track, opponents, gameOver, gameSpeed, speedIncrementInterval;
let isAccelerating = false; // Variável para verificar se está acelerando

const images = {
    track: new Image(),
    playerCar: new Image(),
    opponentCar: new Image()
};

// Substitua os caminhos das imagens conforme necessário
images.track.src = 'images/track.png'; // Caminho para a imagem da pista
images.playerCar.src = 'images/player-car.png'; // Caminho para a imagem do carro do jogador
images.opponentCar.src = 'images/opponent-car.png'; // Caminho para a imagem dos carros inimigos

images.track.onload = function() {
    initializeGame();
    restartButton.style.display = 'none';
    redFlag.style.display = 'none';
    setInterval(createOpponent, 2000);
    gameLoop();
};

function initializeGame() {
    car = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 100,
        width: 50,
        height: 100,
        speed: 8, // Velocidade lateral aumentada
        movingLeft: false,
        movingRight: false
    };

    track = {
        width: 300,
        height: 1000, // Altura da imagem da pista
        position: 0,
        speed: 5,
        normalSpeed: 5, // Velocidade normal da pista
        acceleratedSpeed: 8 // Velocidade acelerada da pista
    };

    opponents = [];
    gameOver = false;
    gameSpeed = 1;
    speedIncrementInterval = setInterval(increaseSpeed, 1000); // Aumenta a velocidade a cada 1 segundo
    redFlag.style.display = 'none'; // Esconder a faixa vermelha ao iniciar o jogo
}

function increaseSpeed() {
    track.normalSpeed += 0.1; // Aumento gradual da velocidade normal da pista
    track.acceleratedSpeed += 0.1; // Aumento gradual da velocidade acelerada da pista
    for (let opponent of opponents) {
        opponent.speed += 0.1; // Aumento gradual da velocidade dos oponentes
    }
}

function createOpponent() {
    const x = Math.random() * (track.width - 50) + (canvas.width - track.width) / 2;
    const y = -100;
    opponents.push({ x, y, width: 50, height: 100, speed: track.speed - 2 });
}

function detectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.height + rect1.y > rect2.y;
}

function checkCollisions() {
    for (let opponent of opponents) {
        if (detectCollision(car, opponent)) {
            gameOver = true;
            restartButton.style.display = 'block';
            redFlag.style.display = 'block'; // Mostrar a faixa vermelha
            clearInterval(speedIncrementInterval); // Para de aumentar a velocidade quando o jogo termina
            return;
        }
    }
}

function update() {
    if (gameOver) return;

    if (car.movingLeft && car.x > (canvas.width - track.width) / 2) car.x -= car.speed;
    if (car.movingRight && car.x + car.width < (canvas.width + track.width) / 2) car.x += car.speed;

    track.position += track.speed;
    if (track.position >= track.height) {
        track.position = 0;
    }

    for (let opponent of opponents) {
        opponent.y += opponent.speed;
    }

    opponents = opponents.filter(opponent => opponent.y < canvas.height);

    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar a pista repetidamente para criar a ilusão de uma pista infinita
    ctx.drawImage(images.track, (canvas.width - track.width) / 2, track.position - track.height, track.width, track.height);
    ctx.drawImage(images.track, (canvas.width - track.width) / 2, track.position, track.width, track.height);

    // Desenhar o carro do jogador
    ctx.drawImage(images.playerCar, car.x, car.y, car.width, car.height);

    // Desenhar os carros inimigos
    for (let opponent of opponents) {
        ctx.drawImage(images.opponentCar, opponent.x, opponent.y, opponent.width, opponent.height);
    }
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

restartButton.addEventListener('click', () => {
    initializeGame();
    restartButton.style.display = 'none';
    redFlag.style.display = 'none'; // Esconder a faixa vermelha ao reiniciar o jogo
    gameLoop();
});

document.addEventListener('keydown', function(event) {
    if(event.key === 'ArrowLeft') car.movingLeft = true;
    if(event.key === 'ArrowRight') car.movingRight = true;
    if(event.key === 'ArrowUp') {
        isAccelerating = true;
        track.speed = track.acceleratedSpeed;
    }
});

document.addEventListener('keyup', function(event) {
    if(event.key === 'ArrowLeft') car.movingLeft = false;
    if(event.key === 'ArrowRight') car.movingRight = false;
    if(event.key === 'ArrowUp') {
        isAccelerating = false;
        track.speed = track.normalSpeed;
    }
});
