// Game variables
let canvas, ctx, startButton, scoreElement, highScoreElement;

// Game state
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('flappyKippHighScore') || 0;
let speed = 2;
let gravity = 0.5;
let jumpStrength = -8;

// Physics presets
const physicsPresets = {
    original: {
        gravity: 0.5,
        jumpStrength: -8,
        speed: 2,
        airResistance: 0
    },
    floaty: {
        gravity: 0.3,
        jumpStrength: -6,
        speed: 2,
        airResistance: 0.1
    },
    heavy: {
        gravity: 0.7,
        jumpStrength: -10,
        speed: 2,
        airResistance: 0.05
    }
};

let currentPreset = physicsPresets.heavy; // Changed default to heavy

// Asset paths (placeholder until actual images are provided)
const assets = {
    playerNormal: 'assets/player-normal.png',
    playerFlap: 'assets/player-flap.png',
    playerHit: 'assets/player-hit.png',
    signs: [
        'assets/signs/maga.png',
        'assets/signs/trump.png',
        'assets/signs/republican.png'
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
            // Calculate dimensions to maintain aspect ratio
            const imgAspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
            let drawWidth = this.width;
            let drawHeight = this.height;
            
            if (drawWidth / drawHeight > imgAspectRatio) {
                drawWidth = drawHeight * imgAspectRatio;
            } else {
                drawHeight = drawWidth / imgAspectRatio;
            }
            
            // Center the image within the player bounds
            const drawX = this.x + (this.width - drawWidth) / 2;
            const drawY = this.y + (this.height - drawHeight) / 2;
            
            ctx.drawImage(currentImage, drawX, drawY, drawWidth, drawHeight);
        }
    },
    
    update() {
        // Apply gravity and air resistance
        this.velocity += currentPreset.gravity;
        this.velocity *= (1 - currentPreset.airResistance);
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
        this.velocity = currentPreset.jumpStrength;
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
    signPadding: 4, // Reduced padding for signs
    
    init() {
        // Load sign images
        assets.signs.forEach(path => {
            const img = new Image();
            img.src = path;
            img.onerror = () => console.log(`Failed to load sign image: ${path}, using fallback`);
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
            obstacle.x -= currentPreset.speed;
            
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
                this.drawFallbackObstacle(obstacle.x, 0, obstacle.topHeight, true);
            } else {
                this.drawSignWithImage(obstacle.x, 0, obstacle.topHeight, img, true);
            }
            
            // Draw bottom obstacle
            if (!img.complete || img.naturalWidth === 0) {
                this.drawFallbackObstacle(obstacle.x, obstacle.bottomY, obstacle.bottomHeight, false);
            } else {
                this.drawSignWithImage(obstacle.x, obstacle.bottomY, obstacle.bottomHeight, img, false);
            }
        });
    },
    
    drawSignWithImage(x, y, height, img, isTop) {
        // Draw pole
        ctx.fillStyle = '#8B4513'; // Brown color for pole
        ctx.fillRect(x + this.width/2 - 2, y, 4, height);
        
        // Calculate sign dimensions
        const signWidth = this.width - (this.signPadding * 2);
        const signHeight = 40;
        const signX = x + this.signPadding;
        const signY = isTop ? y + height - signHeight : y;
        
        // Draw sign background
        ctx.fillStyle = '#e74c3c'; // Red background
        ctx.fillRect(signX, signY, signWidth, signHeight);
        
        // Draw sign border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(signX, signY, signWidth, signHeight);
        
        // Calculate image dimensions to fit within sign while maintaining aspect ratio
        const imgAspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = signWidth - (this.signPadding * 2);
        let drawHeight = signHeight - (this.signPadding * 2);
        
        if (drawWidth / drawHeight > imgAspectRatio) {
            drawWidth = drawHeight * imgAspectRatio;
        } else {
            drawHeight = drawWidth / imgAspectRatio;
        }
        
        // Center the image in the sign
        const imgX = signX + (signWidth - drawWidth) / 2;
        const imgY = signY + (signHeight - drawHeight) / 2;
        
        // Draw the image
        ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
    },
    
    drawFallbackObstacle(x, y, height, isTop) {
        // Draw pole
        ctx.fillStyle = '#8B4513'; // Brown color for pole
        ctx.fillRect(x + this.width/2 - 2, y, 4, height);
        
        // Draw sign
        const signWidth = this.width - (this.signPadding * 2);
        const signHeight = 40;
        const signX = x + this.signPadding;
        const signY = isTop ? y + height - signHeight : y;
        
        // Sign background
        ctx.fillStyle = '#e74c3c'; // Red background
        ctx.fillRect(signX, signY, signWidth, signHeight);
        
        // Sign border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(signX, signY, signWidth, signHeight);
        
        // Sign text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MAGA', signX + signWidth/2, signY + signHeight/2);
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
    
    // Draw score overlay
    if (gameStarted) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'left';
        ctx.strokeText(`Score: ${score}`, 20, 40);
        ctx.fillText(`Score: ${score}`, 20, 40);
    }
    
    // Draw game over message
    if (gameOver) {
        updateHighScore();
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
    highScoreElement = document.getElementById('high-score');
    const physicsPresetSelect = document.getElementById('physics-preset');
    
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
    
    // Update high score display
    highScoreElement.textContent = highScore;
    
    // Add physics preset change handler
    physicsPresetSelect.addEventListener('change', (e) => {
        const preset = e.target.value;
        currentPreset = physicsPresets[preset];
        // Reset game state when changing physics
        if (gameStarted) {
            gameOver = false;
            score = 0;
            scoreElement.textContent = score;
            player.reset();
            obstacles.reset();
        }
    });
    
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
    
    // Mouse click event
    canvas.addEventListener('click', (e) => {
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

// Update high score when game ends
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyKippHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeGame); 