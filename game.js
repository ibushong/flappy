// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const scoreElement = document.getElementById('score');

// Set canvas dimensions
canvas.width = 400;
canvas.height = 600;

// Game state
let gameStarted = false;
let gameOver = false;
let score = 0;
let speed = 2;
let gravity = 0.5;
let jumpStrength = -8;

// Asset paths (placeholder until actual images are provided)
const assets = {
    kippNormal: 'assets/kipp-normal.png',
    kippFlap: 'assets/kipp-flap.png',
    kippHit: 'assets/kipp-hit.png',
    obstacles: [
        'assets/obstacle-maga.png',
        'assets/obstacle-trump.png',
        'assets/obstacle-republican.png'
    ],
    background: 'assets/background.png'
};

// Kipp (the player)
const kipp = {
    x: 100,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    image: new Image(),
    flapImage: new Image(),
    hitImage: new Image(),
    isFlapping: false,
    
    draw() {
        let currentImage = this.image;
        if (this.isFlapping) {
            currentImage = this.flapImage;
        } else if (gameOver) {
            currentImage = this.hitImage;
        }
        
        // Fallback to drawing a circle if images aren't loaded
        if (!currentImage.complete) {
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.drawImage(currentImage, this.x, this.y, this.width, this.height);
        }
    },
    
    update() {
        // Apply gravity
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Prevent going out of bounds
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
            gameOver = true;
        }
    },
    
    flap() {
        this.velocity = jumpStrength;
        this.isFlapping = true;
        setTimeout(() => {
            this.isFlapping = false;
        }, 100);
    },
    
    reset() {
        this.y = canvas.height / 2;
        this.velocity = 0;
    }
};

// Load Kipp's images
kipp.image.src = assets.kippNormal;
kipp.flapImage.src = assets.kippFlap;
kipp.hitImage.src = assets.kippHit;

// Obstacles
const obstacles = {
    list: [],
    width: 60,
    gap: 200,
    minHeight: 50,
    maxHeight: 300,
    spawnInterval: 1500, // ms
    lastSpawnTime: 0,
    images: [],
    
    init() {
        // Load obstacle images
        assets.obstacles.forEach(path => {
            const img = new Image();
            img.src = path;
            this.images.push(img);
        });
    },
    
    spawn() {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            const topHeight = Math.random() * (this.maxHeight - this.minHeight) + this.minHeight;
            const bottomY = topHeight + this.gap;
            const bottomHeight = canvas.height - bottomY;
            
            // Randomly select an obstacle image
            const imageIndex = Math.floor(Math.random() * this.images.length);
            
            this.list.push({
                x: canvas.width,
                topHeight,
                bottomY,
                bottomHeight,
                counted: false,
                imageIndex
            });
            
            this.lastSpawnTime = currentTime;
        }
    },
    
    update() {
        for (let i = 0; i < this.list.length; i++) {
            const obstacle = this.list[i];
            obstacle.x -= speed;
            
            // Check if Kipp passed an obstacle
            if (!obstacle.counted && obstacle.x + this.width < kipp.x) {
                obstacle.counted = true;
                score++;
                scoreElement.textContent = score;
            }
            
            // Check collision
            if (this.checkCollision(obstacle)) {
                gameOver = true;
            }
            
            // Remove obstacles that are off-screen
            if (obstacle.x + this.width < 0) {
                this.list.splice(i, 1);
                i--;
            }
        }
    },
    
    draw() {
        this.list.forEach(obstacle => {
            const img = this.images[obstacle.imageIndex];
            
            // Draw top obstacle
            if (!img.complete) {
                // Fallback to rectangle if image isn't loaded
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(obstacle.x, 0, this.width, obstacle.topHeight);
            } else {
                ctx.drawImage(img, obstacle.x, 0, this.width, obstacle.topHeight);
            }
            
            // Draw bottom obstacle
            if (!img.complete) {
                ctx.fillRect(obstacle.x, obstacle.bottomY, this.width, obstacle.bottomHeight);
            } else {
                ctx.drawImage(img, obstacle.x, obstacle.bottomY, this.width, obstacle.bottomHeight);
            }
        });
    },
    
    checkCollision(obstacle) {
        // Check if Kipp collides with the current obstacle
        return (
            kipp.x + kipp.width > obstacle.x &&
            kipp.x < obstacle.x + this.width && (
                kipp.y < obstacle.topHeight ||
                kipp.y + kipp.height > obstacle.bottomY
            )
        );
    },
    
    reset() {
        this.list = [];
        this.lastSpawnTime = 0;
    }
};

// Initialize obstacles
obstacles.init();

// Background (sky)
function drawBackground() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update and draw game elements
    if (gameStarted && !gameOver) {
        obstacles.spawn();
        obstacles.update();
        kipp.update();
    }
    
    // Always draw elements
    obstacles.draw();
    kipp.draw();
    
    // Draw game over message
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        
        ctx.font = '18px Arial';
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 50);
    }
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        gameOver = false;
        score = 0;
        scoreElement.textContent = score;
        kipp.reset();
        obstacles.reset();
        startButton.textContent = 'Restart Game';
    } else {
        gameOver = false;
        score = 0;
        scoreElement.textContent = score;
        kipp.reset();
        obstacles.reset();
    }
});

window.addEventListener('keydown', (e) => {
    // Space key to flap or restart
    if (e.code === 'Space') {
        if (gameOver) {
            gameOver = false;
            score = 0;
            scoreElement.textContent = score;
            kipp.reset();
            obstacles.reset();
        } else if (gameStarted) {
            kipp.flap();
        } else {
            gameStarted = true;
            startButton.textContent = 'Restart Game';
        }
    }
});

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameOver) {
        gameOver = false;
        score = 0;
        scoreElement.textContent = score;
        kipp.reset();
        obstacles.reset();
    } else if (gameStarted) {
        kipp.flap();
    } else {
        gameStarted = true;
        startButton.textContent = 'Restart Game';
    }
});

// Start the game loop
gameLoop(); 