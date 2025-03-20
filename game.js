// Game variables
let canvas, ctx, startButton, scoreElement;

// Game state
let gameStarted = false;
let gameOver = false;
let score = 0;
let speed = 2;
let gravity = 0.5;
let jumpStrength = -8;

// Asset paths (placeholder until actual images are provided)
const assets = {
    playerNormal: 'assets/player-normal.png',
    playerFlap: 'assets/player-flap.png',
    playerHit: 'assets/player-hit.png',
    obstacles: [
        'assets/obstacle-maga.png',
        'assets/obstacle-trump.png',
        'assets/obstacle-republican.png'
    ],
    fallback: 'assets/fallback.png',
    background: 'assets/background.png'
};

// Create fallback images
const createFallbackImage = (color) => {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 50;
    fallbackCanvas.height = 50;
    const fallbackCtx = fallbackCanvas.getContext('2d');
    fallbackCtx.fillStyle = color;
    fallbackCtx.fillRect(0, 0, 50, 50);
    return fallbackCanvas;
};

const playerFallbackNormal = createFallbackImage('#3498db');
const playerFallbackFlap = createFallbackImage('#2980b9');
const playerFallbackHit = createFallbackImage('#e74c3c');
const obstacleFallback = createFallbackImage('#e74c3c');

// Player (the character)
const player = {
    x: 100,
    y: 300, // Will be set properly on init
    width: 50,
    height: 50,
    velocity: 0,
    image: new Image(),
    flapImage: new Image(),
    hitImage: new Image(),
    isFlapping: false,
    
    init() {
        this.y = canvas.height / 2;
    },
    
    draw() {
        let currentImage = this.image;
        let fallbackImg = playerFallbackNormal;
        
        if (this.isFlapping) {
            currentImage = this.flapImage;
            fallbackImg = playerFallbackFlap;
        } else if (gameOver) {
            currentImage = this.hitImage;
            fallbackImg = playerFallbackHit;
        }
        
        // Fallback to canvas if images aren't loaded
        if (!currentImage.complete || currentImage.naturalWidth === 0) {
            ctx.drawImage(fallbackImg, this.x, this.y, this.width, this.height);
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
            img.onerror = () => console.log(`Failed to load obstacle image: ${path}, using fallback`);
            this.images.push(img);
        });
        
        // If no images are provided, use at least one fallback
        if (this.images.length === 0) {
            this.images.push(obstacleFallback);
        }
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
            
            // Check if player passed an obstacle
            if (!obstacle.counted && obstacle.x + this.width < player.x) {
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
            if (!img.complete || img.naturalWidth === 0) {
                // Fallback to rectangle if image isn't loaded
                ctx.drawImage(obstacleFallback, obstacle.x, 0, this.width, obstacle.topHeight);
            } else {
                ctx.drawImage(img, obstacle.x, 0, this.width, obstacle.topHeight);
            }
            
            // Draw bottom obstacle
            if (!img.complete || img.naturalWidth === 0) {
                ctx.drawImage(obstacleFallback, obstacle.x, obstacle.bottomY, this.width, obstacle.bottomHeight);
            } else {
                ctx.drawImage(img, obstacle.x, obstacle.bottomY, this.width, obstacle.bottomHeight);
            }
        });
    },
    
    checkCollision(obstacle) {
        // Check if player collides with the current obstacle
        return (
            player.x + player.width > obstacle.x &&
            player.x < obstacle.x + this.width && (
                player.y < obstacle.topHeight ||
                player.y + player.height > obstacle.bottomY
            )
        );
    },
    
    reset() {
        this.list = [];
        this.lastSpawnTime = 0;
    }
};

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
        player.update();
    }
    
    // Always draw elements
    obstacles.draw();
    player.draw();
    
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

// Initialize the game
function initializeGame() {
    // Initialize DOM elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    startButton = document.getElementById('start-button');
    scoreElement = document.getElementById('score');
    
    // Set canvas dimensions
    canvas.width = 400;
    canvas.height = 600;
    
    // Initialize player
    player.init();
    
    // Load player's images
    player.image.src = assets.playerNormal;
    player.flapImage.src = assets.playerFlap;
    player.hitImage.src = assets.playerHit;
    
    // Add error handling for image loading
    player.image.onerror = () => console.log("Failed to load player normal image, using fallback");
    player.flapImage.onerror = () => console.log("Failed to load player flap image, using fallback");
    player.hitImage.onerror = () => console.log("Failed to load player hit image, using fallback");
    
    // Initialize obstacles
    obstacles.init();
    
    // Add event listeners
    startButton.addEventListener('click', () => {
        if (!gameStarted) {
            gameStarted = true;
            gameOver = false;
            score = 0;
            scoreElement.textContent = score;
            player.reset();
            obstacles.reset();
            startButton.textContent = 'Restart Game';
        } else {
            gameOver = false;
            score = 0;
            scoreElement.textContent = score;
            player.reset();
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
                player.reset();
                obstacles.reset();
            } else if (gameStarted) {
                player.flap();
            } else {
                gameStarted = true;
                startButton.textContent = 'Restart Game';
            }
            
            // Prevent scrolling when pressing space
            e.preventDefault();
        }
    });
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameOver) {
            gameOver = false;
            score = 0;
            scoreElement.textContent = score;
            player.reset();
            obstacles.reset();
        } else if (gameStarted) {
            player.flap();
        } else {
            gameStarted = true;
            startButton.textContent = 'Restart Game';
        }
    });
    
    // Start the game loop
    gameLoop();
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeGame); 