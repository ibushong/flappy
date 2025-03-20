/**
 * This file contains code to generate fallback images for the game.
 * You can run this script separately to create basic PNG images,
 * or just rely on the game's built-in canvas-based fallbacks.
 */

// This is the same function used in the game for fallback generation
function createFallbackImage(color, size = 50) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    return canvas;
}

// To use this in a browser console to generate and download images:
// 1. Create the canvas
// const playerCanvas = createFallbackImage('#3498db');
// const obstacleCanvas = createFallbackImage('#e74c3c');
//
// 2. Convert to data URL
// const playerImageURL = playerCanvas.toDataURL('image/png');
// const obstacleImageURL = obstacleCanvas.toDataURL('image/png');
//
// 3. Create a download link
// const playerLink = document.createElement('a');
// playerLink.href = playerImageURL;
// playerLink.download = 'player-normal.png';
// document.body.appendChild(playerLink);
// playerLink.click();
// document.body.removeChild(playerLink);
//
// const obstacleLink = document.createElement('a');
// obstacleLink.href = obstacleImageURL;
// obstacleLink.download = 'obstacle-fallback.png';
// document.body.appendChild(obstacleLink);
// obstacleLink.click();
// document.body.removeChild(obstacleLink); 