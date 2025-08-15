class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'start'; // start, playing, paused, gameOver
        
        // Game properties
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.keys = {};
        this.lastTime = 0;
        this.particles = [];
        
        // Mobile controls
        this.isMobile = window.innerWidth <= 768;
        this.touchControls = {
            left: false,
            right: false,
            fire: false
        };
        
        // Game objects
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 60);
        this.bullets = [];
        this.enemies = [];
        this.obstacles = [];
        this.powerUps = [];
        this.enemyBullets = [];
        
        // Wave management
        this.enemiesPerWave = 5;
        this.enemySpawnTimer = 0;
        this.enemySpawnDelay = 2000;
        this.enemiesSpawned = 0;
        this.waveCompleted = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupMobileControls();
        this.resizeCanvas();
        this.generateObstacles();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.player.shoot(this.bullets);
                }
            }
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse events
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                this.player.shoot(this.bullets);
            }
        });
        
        // UI button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('pauseRestartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('gameRestartBtn').addEventListener('click', () => this.restartGame());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    setupMobileControls() {
        const moveLeft = document.getElementById('moveLeft');
        const moveRight = document.getElementById('moveRight');
        const fireBtn = document.getElementById('fireBtn');
        
        // Touch events for mobile controls
        moveLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.left = true;
        });
        moveLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
        });
        
        moveRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.right = true;
        });
        moveRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
        });
        
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.player.shoot(this.bullets);
            }
        });
        
        // Mouse events for desktop
        moveLeft.addEventListener('mousedown', () => this.touchControls.left = true);
        moveLeft.addEventListener('mouseup', () => this.touchControls.left = false);
        moveRight.addEventListener('mousedown', () => this.touchControls.right = true);
        moveRight.addEventListener('mouseup', () => this.touchControls.right = false);
        fireBtn.addEventListener('mousedown', () => {
            if (this.gameState === 'playing') {
                this.player.shoot(this.bullets);
            }
        });
    }
    
    resizeCanvas() {
        const container = document.querySelector('.game-container');
        const header = document.querySelector('.game-header');
        const controls = document.querySelector('.mobile-controls');
        
        if (window.innerWidth <= 768) {
            this.canvas.width = Math.min(window.innerWidth - 20, 400);
            this.canvas.height = Math.min(window.innerHeight - 200, 500);
            controls.style.display = 'block';
        } else {
            this.canvas.width = 800;
            this.canvas.height = 600;
            controls.style.display = 'none';
        }
        
        // Reposition player
        if (this.player) {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height - 60;
        }
    }
    
    generateObstacles() {
        this.obstacles = [];
        const numObstacles = 3 + Math.floor(this.wave / 2);
        
        for (let i = 0; i < numObstacles; i++) {
            const x = Math.random() * (this.canvas.width - 60) + 30;
            const y = Math.random() * (this.canvas.height / 2) + 100;
            this.obstacles.push(new Obstacle(x, y));
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.particles = [];
        this.enemiesSpawned = 0;
        this.waveCompleted = false;
        this.enemySpawnTimer = 0;
        
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 60);
        this.generateObstacles();
        this.updateUI();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update player
        this.updatePlayer();
        
        // Update bullets
        this.updateBullets();
        
        // Update enemies
        this.updateEnemies(deltaTime);
        
        // Update enemy bullets
        this.updateEnemyBullets();
        
        // Update power-ups
        this.updatePowerUps();
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
        
        // Spawn enemies
        this.spawnEnemies(deltaTime);
        
        // Check wave completion
        this.checkWaveCompletion();
        
        // Check game over
        this.checkGameOver();
    }
    
    updatePlayer() {
        // Handle input
        if (this.keys['a'] || this.keys['arrowleft'] || this.touchControls.left) {
            this.player.moveLeft();
        }
        if (this.keys['d'] || this.keys['arrowright'] || this.touchControls.right) {
            this.player.moveRight();
        }
        
        this.player.update(this.canvas.width);
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.y > 0;
        });
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
            
            // Enemy shooting
            if (Math.random() < 0.001 * (1 + this.wave * 0.2)) {
                this.enemyBullets.push(new EnemyBullet(enemy.x, enemy.y + enemy.height));
            }
        });
        
        // Remove enemies that are off screen
        this.enemies = this.enemies.filter(enemy => enemy.y < this.canvas.height + 50);
    }
    
    updateEnemyBullets() {
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.update();
            return bullet.y < this.canvas.height;
        });
    }
    
    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            return powerUp.y < this.canvas.height;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
    }
    
    spawnEnemies(deltaTime) {
        if (this.enemiesSpawned < this.enemiesPerWave) {
            this.enemySpawnTimer += deltaTime;
            
            if (this.enemySpawnTimer >= this.enemySpawnDelay) {
                const x = Math.random() * (this.canvas.width - 40);
                const enemyType = Math.random() < 0.7 ? 'basic' : 'fast';
                this.enemies.push(new Enemy(x, -40, enemyType));
                this.enemiesSpawned++;
                this.enemySpawnTimer = 0;
                
                // Decrease spawn delay for higher waves
                this.enemySpawnDelay = Math.max(500, 2000 - this.wave * 100);
            }
        }
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += enemy.points;
                    
                    // Chance to drop power-up
                    if (Math.random() < 0.1) {
                        this.powerUps.push(new PowerUp(enemy.x, enemy.y));
                    }
                }
            });
            
            // Bullets vs obstacles
            this.obstacles.forEach((obstacle, obstIndex) => {
                if (obstacle.health > 0 && this.isColliding(bullet, obstacle)) {
                    this.bullets.splice(bulletIndex, 1);
                    obstacle.takeDamage();
                    this.createSparks(bullet.x, bullet.y);
                }
            });
        });
        
        // Enemy bullets vs player
        this.enemyBullets.forEach((bullet, bulletIndex) => {
            if (this.isColliding(bullet, this.player)) {
                this.enemyBullets.splice(bulletIndex, 1);
                this.lives--;
                this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
            }
            
            // Enemy bullets vs obstacles
            this.obstacles.forEach((obstacle) => {
                if (obstacle.health > 0 && this.isColliding(bullet, obstacle)) {
                    this.enemyBullets.splice(bulletIndex, 1);
                    obstacle.takeDamage();
                    this.createSparks(bullet.x, bullet.y);
                }
            });
        });
        
        // Player vs enemies
        this.enemies.forEach((enemy, enemyIndex) => {
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(enemyIndex, 1);
                this.lives--;
                this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            }
        });
        
        // Player vs power-ups
        this.powerUps.forEach((powerUp, powerIndex) => {
            if (this.isColliding(this.player, powerUp)) {
                this.powerUps.splice(powerIndex, 1);
                this.applyPowerUp(powerUp.type);
            }
        });
        
        this.updateUI();
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, 'explosion'));
        }
    }
    
    createSparks(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, 'spark'));
        }
    }
    
    applyPowerUp(type) {
        switch(type) {
            case 'health':
                this.lives = Math.min(this.lives + 1, 5);
                break;
            case 'rapidFire':
                this.player.rapidFire = true;
                setTimeout(() => this.player.rapidFire = false, 5000);
                break;
            case 'shield':
                this.player.shield = true;
                setTimeout(() => this.player.shield = false, 8000);
                break;
        }
    }
    
    checkWaveCompletion() {
        if (this.enemiesSpawned >= this.enemiesPerWave && this.enemies.length === 0 && !this.waveCompleted) {
            this.waveCompleted = true;
            this.wave++;
            this.enemiesPerWave += 2;
            this.enemiesSpawned = 0;
            this.waveCompleted = false;
            this.generateObstacles();
            
            // Bonus points for completing wave
            this.score += this.wave * 100;
        }
    }
    
    checkGameOver() {
        if (this.lives <= 0) {
            this.gameState = 'gameOver';
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('finalWave').textContent = this.wave - 1;
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('lives').textContent = this.lives;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 17, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStars();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // Draw obstacles
            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
            
            // Draw player
            this.player.draw(this.ctx);
            
            // Draw bullets
            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            
            // Draw enemies
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            
            // Draw enemy bullets
            this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
            
            // Draw power-ups
            this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
            
            // Draw particles
            this.particles.forEach(particle => particle.draw(this.ctx));
        }
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 73) % this.canvas.height;
            const size = Math.sin(i) * 0.5 + 0.5;
            this.ctx.globalAlpha = size;
            this.ctx.fillRect(x, y, 1, 1);
        }
        this.ctx.globalAlpha = 1;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.speed = 5;
        this.rapidFire = false;
        this.shield = false;
        this.lastShot = 0;
    }
    
    moveLeft() {
        this.x -= this.speed;
    }
    
    moveRight() {
        this.x += this.speed;
    }
    
    update(canvasWidth) {
        // Keep player within bounds
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    }
    
    shoot(bullets) {
        const now = Date.now();
        const shootDelay = this.rapidFire ? 100 : 200;
        
        if (now - this.lastShot > shootDelay) {
            bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, -8));
            this.lastShot = now;
        }
    }
    
    draw(ctx) {
        // Draw shield effect
        if (this.shield) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw player ship
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw ship details
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        
        // Draw engines
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x + 5, this.y + this.height, 8, 10);
        ctx.fillRect(this.x + this.width - 13, this.y + this.height, 8, 10);
    }
}

class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        if (type === 'fast') {
            this.width = 30;
            this.height = 25;
            this.speed = 2;
            this.points = 20;
            this.color = '#ff4444';
        } else {
            this.width = 40;
            this.height = 30;
            this.speed = 1;
            this.points = 10;
            this.color = '#ff8800';
        }
        
        this.direction = Math.random() < 0.5 ? -1 : 1;
    }
    
    update(deltaTime) {
        this.y += this.speed;
        this.x += this.direction * 0.5;
        
        // Bounce off walls
        if (this.x <= 0 || this.x >= 800 - this.width) {
            this.direction *= -1;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw enemy details
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        
        // Draw enemy eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
        ctx.fillRect(this.x + this.width - 14, this.y + 8, 6, 6);
    }
}

class Bullet {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = speed;
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class EnemyBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 8;
        this.speed = 3;
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add glow effect
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 40;
        this.maxHealth = 3;
        this.health = this.maxHealth;
    }
    
    takeDamage() {
        this.health--;
    }
    
    draw(ctx) {
        if (this.health <= 0) return;
        
        // Color based on health
        const healthRatio = this.health / this.maxHealth;
        const red = Math.floor(255 * (1 - healthRatio));
        const green = Math.floor(255 * healthRatio);
        
        ctx.fillStyle = `rgb(${red}, ${green}, 100)`;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        
        const types = ['health', 'rapidFire', 'shield'];
        this.type = types[Math.floor(Math.random() * types.length)];
        
        this.colors = {
            health: '#00ff00',
            rapidFire: '#ffff00',
            shield: '#00ffff'
        };
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.colors[this.type];
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add pulsing effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1;
        
        // Draw symbol
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const symbol = this.type === 'health' ? '+' : this.type === 'rapidFire' ? 'R' : 'S';
        ctx.fillText(symbol, this.x + this.width/2, this.y + this.height/2 + 4);
    }
}

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        
        if (type === 'explosion') {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.color = `hsl(${Math.random() * 60}, 100%, 50%)`;
            this.size = Math.random() * 4 + 2;
        } else if (type === 'spark') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4;
            this.color = '#ffffff';
            this.size = Math.random() * 2 + 1;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
    }
    
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});
