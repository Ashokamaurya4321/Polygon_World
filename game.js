class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.plane = {
            x: 100,
            y: this.canvas.height / 2,
            width: 40,
            height: 20,
            speed: 0
        };
        
        // Reset score and level
        this.score = 0;
        this.level = 1;
        this.obstaclesPassed = 0;
        
        // Reset game state
        this.gameOver = false;
        this.gameStarted = false;
        
        // Initialize other properties
        this.highScore = localStorage.getItem('highScore') || 0;
        this.obstacles = [];
        this.obstacleTypes = [
            'rectangle', 
            'triangle', 
            'hexagon', 
            'circle', 
            'pentagon',
            'octagon', 
            'star', 
            'diamond'
        ];
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        this.minSpeed = 5;
        this.obstacleSpeed = this.minSpeed;
        
        this.closePassPoints = 10;
        this.closePassThreshold = 30; // pixels
        
        // Level-specific colors
        this.levelColors = {
            background: [
                '#1a1a2e', // Level 1
                '#16213e', // Level 2
                '#1b1b3a', // Level 3
                '#242447', // Level 4
                '#2c2c54'  // Level 5+
            ],
            plane: [
                '#ffffff', // Level 1
                '#00ff00', // Level 2
                '#00ffff', // Level 3
                '#ffff00', // Level 4
                '#ff69b4'  // Level 5+
            ]
        };
        
        // Initialize background color
        this.updateColors();
        
        this.bindEvents();
        this.updateHighScore();
        
        // Add window resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Add new properties for scoring with logging
        this.baseScoreRate = 0.02;  // Points per frame
        this.scoreMultiplier = 1;
        this.obstaclePassPoints = 2;
        
        console.log('Initial score settings:', {
            baseScoreRate: this.baseScoreRate,
            scoreMultiplier: this.scoreMultiplier,
            obstaclePassPoints: this.obstaclePassPoints,
            initialScore: this.score
        });

        // Screen size based calculations
        this.screenRatio = window.innerWidth / window.innerHeight;
        this.basePlaneSize = {
            width: Math.min(window.innerWidth * 0.05, 60),  // 5% of screen width, max 60px
            height: Math.min(window.innerHeight * 0.05, 40)  // 5% of screen height, max 40px
        };

        // Update plane size
        this.plane = {
            x: 100,
            y: this.canvas.height / 2,
            width: this.basePlaneSize.width,
            height: this.basePlaneSize.height,
            speed: 0
        };

        // Set initial background color
        this.canvas.style.backgroundColor = '#1a1a2e'; // Level 1 background color
        this.planeColor = '#ffffff'; // Level 1 plane color

        // Add animation types
        this.animationTypes = [
            'scale',      // grow and shrink
            'spin',       // rotate 
            'bounce',     // move up and down
            'fall',       // fall from top to bottom
            'rise',       // rise from bottom to top
            'jitter'      // small random movements
        ];

        // Add game started state variable
        this.gameStarted = false;
        
        // Don't start the game loop immediately
        // Remove or comment out: this.gameLoop();
        
        // Instead, wait for start button click
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        console.log('Game initialized, waiting for start button click');

        // Add difficulty settings
        this.difficulties = {
            easy: {
                planeSpeed: 5,        // Reduced from 6
                baseSpeed: 4,         // Reduced from 5
                obstacleFrequency: 0.8, // Reduced from 1
                scoreMultiplier: 1,
                gravity: 2.5,         // Reduced from 3
                maxDownSpeed: 7       // Reduced from 8
            },
            medium: {
                planeSpeed: 6,        // Reduced from 7
                baseSpeed: 5,         // Reduced from 6
                obstacleFrequency: 1.2, // Reduced from 1.5
                scoreMultiplier: 1.5,
                gravity: 3,           // Reduced from 4
                maxDownSpeed: 8       // Reduced from 9
            },
            hard: {
                planeSpeed: 7,        // Reduced from 8
                baseSpeed: 6,         // Reduced from 7
                obstacleFrequency: 1.5, // Reduced from 1.8
                scoreMultiplier: 2,
                gravity: 3.5,         // Reduced from 4.5
                maxDownSpeed: 9       // Reduced from 10
            },
            extreme: {
                planeSpeed: 8,        // Reduced from 9
                baseSpeed: 7,         // Reduced from 8
                obstacleFrequency: 1.8, // Reduced from 2
                scoreMultiplier: 3,
                gravity: 4,           // Reduced from 5
                maxDownSpeed: 10      // Reduced from 11
            }
        };
        
        this.difficulty = null; // Will be set when difficulty is selected
        this.bindDifficultySelection();
        
        // Time-based updates
        this.lastUpdateTime = Date.now();
        this.deltaTime = 0;
        
        // Calculate responsive sizes
        this.calculateResponsiveSizes();

        // Add control state
        this.controls = {
            isUpPressed: false,
            isDownPressed: false,
            isTouchActive: false
        };

        // Bind touch events
        this.bindTouchEvents();
    }

    calculateResponsiveSizes() {
        // Get device type
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 768 && window.innerWidth > 480;
        
        // Base size calculations
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const baseUnit = Math.min(screenWidth, screenHeight) / 100; // 1% of smallest screen dimension
        
        // Plane size calculations
        this.basePlaneSize = {
            width: isMobile ? baseUnit * 8 : isTablet ? baseUnit * 6 : baseUnit * 4,
            height: isMobile ? baseUnit * 4 : isTablet ? baseUnit * 3 : baseUnit * 2
        };

        // Update plane size
        this.plane.width = this.basePlaneSize.width;
        this.plane.height = this.basePlaneSize.height;
        
        // Store obstacle size factors
        this.obstacleBaseSizes = {
            minWidth: baseUnit * 3,
            maxWidth: baseUnit * 8,
            minHeight: baseUnit * 10,
            maxHeight: baseUnit * 20
        };
        
        console.log('Responsive sizes calculated:', {
            deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
            baseUnit,
            planeSize: this.basePlaneSize,
            obstacleBaseSizes: this.obstacleBaseSizes
        });
    }

    bindDifficultySelection() {
        const buttons = document.querySelectorAll('.difficulty-btn');
        const startButton = document.getElementById('startButton');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                
                this.difficulty = button.dataset.difficulty;
                startButton.disabled = false;
                startButton.textContent = 'Start Game';
                
                const diffSettings = this.difficulties[this.difficulty];
                this.minSpeed = diffSettings.baseSpeed;
                this.obstacleSpeed = this.minSpeed;
                this.scoreMultiplier = diffSettings.scoreMultiplier;
                
                console.log('Difficulty Selected - Initial Speeds:', {
                    obstacleSpeed: this.obstacleSpeed,
                    planeUpSpeed: -diffSettings.planeSpeed,
                    planeDownSpeed: diffSettings.maxDownSpeed,
                    planeGravity: diffSettings.gravity
                });
            });
        });
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.calculateResponsiveSizes();
    }

    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted || this.gameOver) return;

            const diffSettings = this.difficulties[this.difficulty];
            if (e.code === 'ArrowUp') {
                this.controls.isUpPressed = true;
                this.plane.speed = -diffSettings.planeSpeed;
            } else if (e.code === 'ArrowDown') {
                this.controls.isDownPressed = true;
                this.plane.speed = diffSettings.maxDownSpeed;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!this.gameStarted || this.gameOver) return;
            
            if (e.code === 'ArrowUp') {
                this.controls.isUpPressed = false;
            } else if (e.code === 'ArrowDown') {
                this.controls.isDownPressed = false;
            }
        });
    }

    bindTouchEvents() {
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            if (!this.gameStarted || this.gameOver) return;

            this.controls.isTouchActive = true;
            const diffSettings = this.difficulties[this.difficulty];
            this.plane.speed = -diffSettings.planeSpeed;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameStarted || this.gameOver) return;

            this.controls.isTouchActive = false;
        }, { passive: false });

        // Prevent default touch behaviors
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    getObstacleDimensions() {
        const dims = this.obstacleBaseSizes;
        const width = dims.minWidth + Math.random() * (dims.maxWidth - dims.minWidth);
        const height = dims.minHeight + Math.random() * (dims.maxHeight - dims.minHeight);
        
        // Adjust dimensions based on level
        const levelMultiplier = 1 + (this.level - 1) * 0.1;
        
        return {
            width: width * levelMultiplier,
            height: height * levelMultiplier
        };
    }

    createObstacle() {
        const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const dimensions = this.getObstacleDimensions();
        
        // Determine vertical position (top, middle, or bottom)
        const position = Math.floor(Math.random() * 3);
        let y;
        switch(position) {
            case 0: // Top
                y = 0;
                break;
            case 1: // Middle
                y = (this.canvas.height - dimensions.height) / 2;
                break;
            case 2: // Bottom
                y = this.canvas.height - dimensions.height;
                break;
        }
        
        // Pick a random animation type
        const animation = this.animationTypes[Math.floor(Math.random() * this.animationTypes.length)];
        
        // Additional animation properties
        const animProps = {
            rotation: 0,
            rotationSpeed: (Math.random() * 0.05) + 0.01,
            bounceOffset: 0,
            bounceSpeed: (Math.random() * 0.8) + 0.2,
            bounceDirection: 1,
            jitterX: 0,
            jitterY: 0,
            originalY: y
        };
        
        return {
            x: this.canvas.width,
            y: y,
            width: dimensions.width,
            height: dimensions.height,
            type: type,
            color: color,
            scale: 1,
            scaleDirection: 1,
            animation: animation,
            animProps: animProps,
            passed: false,
            destroying: false,
            destroyFrame: 0
        };
    }

    drawPlane() {
        this.ctx.fillStyle = this.planeColor;
        this.ctx.fillRect(this.plane.x, this.plane.y, this.plane.width, this.plane.height);
    }

    drawObstacle(obstacle) {
        this.ctx.fillStyle = obstacle.color;
        
        // Apply transformations for animations
        this.ctx.save();
        
        // Calculate center position for rotation
        const centerX = obstacle.x + (obstacle.width * obstacle.scale) / 2;
        const centerY = obstacle.y + (obstacle.height * obstacle.scale) / 2;
        
        // Apply rotation if spinning
        if (obstacle.animation === 'spin' || obstacle.animation === 'all') {
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(obstacle.animProps.rotation);
            this.ctx.translate(-centerX, -centerY);
        }
        
        // Apply jitter offset if jittering
        const jitterX = obstacle.animProps.jitterX || 0;
        const jitterY = obstacle.animProps.jitterY || 0;
        
        switch(obstacle.type) {
            case 'rectangle':
                this.ctx.fillRect(
                    obstacle.x + jitterX,
                    obstacle.y + jitterY,
                    obstacle.width * obstacle.scale,
                    obstacle.height * obstacle.scale
                );
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + jitterX, obstacle.y + obstacle.height * obstacle.scale + jitterY);
                this.ctx.lineTo(obstacle.x + obstacle.width * obstacle.scale + jitterX, obstacle.y + obstacle.height * obstacle.scale + jitterY);
                this.ctx.lineTo(obstacle.x + (obstacle.width * obstacle.scale) / 2 + jitterX, obstacle.y + jitterY);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'hexagon':
                this.drawPolygon(
                    centerX + jitterX,
                    centerY + jitterY,
                    Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2,
                    6
                );
                break;
                
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(
                    centerX + jitterX,
                    centerY + jitterY,
                    Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
                break;
                
            case 'pentagon':
                this.drawPolygon(
                    centerX + jitterX,
                    centerY + jitterY,
                    Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2,
                    5
                );
                break;
                
            case 'octagon':
                this.drawPolygon(
                    centerX + jitterX,
                    centerY + jitterY,
                    Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2,
                    8
                );
                break;
                
            case 'star':
                this.drawStar(
                    centerX + jitterX,
                    centerY + jitterY,
                    Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2,
                    Math.min(obstacle.width, obstacle.height) * obstacle.scale / 4,
                    5
                );
                break;
                
            case 'diamond':
                this.drawDiamond(
                    obstacle.x + jitterX,
                    obstacle.y + jitterY,
                    obstacle.width * obstacle.scale,
                    obstacle.height * obstacle.scale
                );
                break;
        }
        
        this.ctx.restore();
    }

    drawPolygon(centerX, centerY, radius, sides, rotation = 0) {
        this.ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = rotation + (i * 2 * Math.PI / sides);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawStar(centerX, centerY, outerRadius, innerRadius, points, rotation = 0) {
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = rotation + (i * Math.PI / points);
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawDiamond(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, y);
        this.ctx.lineTo(x + width, centerY);
        this.ctx.lineTo(centerX, y + height);
        this.ctx.lineTo(x, centerY);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawExplosion(obstacle) {
        const particles = 20;
        const maxRadius = 30;
        const progress = obstacle.destroyFrame / 20; // 20 frames for explosion

        this.ctx.save();
        for (let i = 0; i < particles; i++) {
            const angle = (Math.PI * 2 / particles) * i;
            const radius = maxRadius * progress;
            const x = obstacle.x + Math.cos(angle) * radius;
            const y = obstacle.y + Math.sin(angle) * radius;
            
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(255, ${Math.random() * 255}, 0, ${1 - progress})`;
            this.ctx.arc(x, y, 3 * (1 - progress), 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    updateScore() {
        if (!this.gameStarted || this.gameOver) return;
        
        this.score += this.baseScoreRate * this.scoreMultiplier;
        this.scoreMultiplier = 1 + (this.level - 1) * 0.5;
        this.obstaclePassPoints = 2 * this.level;
    }

    validateScore() {
        if (isNaN(this.score)) {
            console.error('Score became NaN! Resetting to 0');
            this.score = 0;
        }
    }

    updateObstacles() {
        if (!this.gameStarted || this.gameOver) return;
        
        const diffSettings = this.difficulties[this.difficulty];
        const obstacleSpacing = 300 / diffSettings.obstacleFrequency;
        
        if (this.obstacles.length === 0 || 
            this.obstacles[this.obstacles.length - 1].x < this.canvas.width - obstacleSpacing) {
            this.obstacles.push(this.createObstacle());
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            if (obstacle.destroying) {
                obstacle.destroyFrame++;
                if (obstacle.destroyFrame > 20) {
                    this.obstacles.splice(i, 1);
                }
                continue;
            }

            obstacle.x -= this.obstacleSpeed;
            this.updateObstacleAnimations(obstacle);

            if (!obstacle.passed && this.plane.x > obstacle.x + obstacle.width) {
                this.score += this.obstaclePassPoints;
                obstacle.passed = true;
                this.obstaclesPassed++;
            }

            if (obstacle.x + obstacle.width < 0) {
                obstacle.destroying = true;
                if (!obstacle.passed) {
                    this.obstaclesPassed++;
                }
            }
        }
    }

    checkCollision() {
        if (!this.gameStarted || this.gameOver) return;
        
        for (const obstacle of this.obstacles) {
            // Only check collision if the obstacle is in range of the plane
            if (obstacle.x + obstacle.width >= this.plane.x && 
                obstacle.x <= this.plane.x + this.plane.width) {
                
                let collision = false;
                
                switch(obstacle.type) {
                    case 'rectangle':
                        collision = this.checkRectangleCollision(obstacle);
                        break;
                    case 'triangle':
                        collision = this.checkTriangleCollision(obstacle);
                        break;
                    case 'hexagon':
                    case 'pentagon':
                    case 'octagon':
                        collision = this.checkPolygonCollision(obstacle);
                        break;
                    case 'circle':
                        collision = this.checkCircleCollision(obstacle);
                        break;
                    case 'star':
                        collision = this.checkStarCollision(obstacle);
                        break;
                    case 'diamond':
                        collision = this.checkDiamondCollision(obstacle);
                        break;
                }
                
                if (collision) {
                    console.log(`Game Over: Plane crashed into ${obstacle.type} obstacle!`, {
                        obstacleType: obstacle.type,
                        obstaclePosition: { x: obstacle.x, y: obstacle.y },
                        planePosition: { x: this.plane.x, y: this.plane.y }
                    });
                    this.endGame('obstacle');
                    return;
                }
            }
        }
    }

    checkRectangleCollision(obstacle) {
        return this.plane.x < obstacle.x + (obstacle.width * obstacle.scale) &&
               this.plane.x + this.plane.width > obstacle.x &&
               this.plane.y < obstacle.y + (obstacle.height * obstacle.scale) &&
               this.plane.y + this.plane.height > obstacle.y;
    }

    checkTriangleCollision(obstacle) {
        // Define triangle points
        const p1 = { x: obstacle.x, y: obstacle.y + obstacle.height * obstacle.scale };
        const p2 = { x: obstacle.x + obstacle.width * obstacle.scale, y: obstacle.y + obstacle.height * obstacle.scale };
        const p3 = { x: obstacle.x + (obstacle.width * obstacle.scale) / 2, y: obstacle.y };
        
        // Check if any corner of the plane is inside the triangle
        const planeCorners = [
            { x: this.plane.x, y: this.plane.y },
            { x: this.plane.x + this.plane.width, y: this.plane.y },
            { x: this.plane.x, y: this.plane.y + this.plane.height },
            { x: this.plane.x + this.plane.width, y: this.plane.y + this.plane.height }
        ];

        return planeCorners.some(corner => this.pointInTriangle(corner, p1, p2, p3));
    }

    checkHexagonCollision(obstacle) {
        const center = {
            x: obstacle.x + (obstacle.width * obstacle.scale) / 2,
            y: obstacle.y + (obstacle.height * obstacle.scale) / 2
        };
        const radius = Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2;
        
        // Generate hexagon points
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            hexPoints.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            });
        }

        // Check if any corner of the plane is inside the hexagon
        const planeCorners = [
            { x: this.plane.x, y: this.plane.y },
            { x: this.plane.x + this.plane.width, y: this.plane.y },
            { x: this.plane.x, y: this.plane.y + this.plane.height },
            { x: this.plane.x + this.plane.width, y: this.plane.y + this.plane.height }
        ];

        return planeCorners.some(corner => this.pointInPolygon(corner, hexPoints));
    }

    pointInTriangle(p, p1, p2, p3) {
        const area = 0.5 * (-p2.y * p3.x + p1.y * (-p2.x + p3.x) + p1.x * (p2.y - p3.y) + p2.x * p3.y);
        const s = 1 / (2 * area) * (p1.y * p3.x - p1.x * p3.y + (p3.y - p1.y) * p.x + (p1.x - p3.x) * p.y);
        const t = 1 / (2 * area) * (p1.x * p2.y - p1.y * p2.x + (p1.y - p2.y) * p.x + (p2.x - p1.x) * p.y);
        
        return s >= 0 && t >= 0 && (1 - s - t) >= 0;
    }

    pointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    updateLevel() {
        const currentScore = Math.floor(this.score);
        const newLevel = Math.floor(currentScore / 100) + 1;
        
        if (newLevel !== this.level) {
            this.level = newLevel;
            
            const diffSettings = this.difficulties[this.difficulty];
            const baseSpeed = diffSettings.baseSpeed;
            let maxSpeedIncrease;
            
            switch(this.difficulty) {
                case 'easy': maxSpeedIncrease = 2; break;
                case 'medium': maxSpeedIncrease = 3; break;
                case 'hard': maxSpeedIncrease = 4; break;
                case 'extreme': maxSpeedIncrease = 5; break;
                default: maxSpeedIncrease = 2;
            }
            
            const levelSpeedIncrease = Math.min((this.level - 1) * 0.3, maxSpeedIncrease);
            this.obstacleSpeed = Math.min(baseSpeed + levelSpeedIncrease, baseSpeed + maxSpeedIncrease);
            
            console.log('Speed Update - Level:', this.level, {
                obstacleSpeed: this.obstacleSpeed,
                planeUpSpeed: -diffSettings.planeSpeed,
                planeDownSpeed: diffSettings.maxDownSpeed,
                planeGravity: diffSettings.gravity
            });
            
            document.getElementById('level').textContent = this.level;
            this.updateColors();
        }
    }

    updateHighScore() {
        // Convert current score to integer
        const currentScore = Math.floor(this.score);
        
        if (currentScore > this.highScore) {
            this.highScore = currentScore;
            localStorage.setItem('highScore', this.highScore);
        }
        
        // Update score displays
        document.getElementById('score').textContent = currentScore;
        document.getElementById('level').textContent = this.level;
        document.getElementById('obstaclesPassed').textContent = this.obstaclesPassed;
        
        // Update or create the high score display
        let highScoreDisplay = document.querySelector('.high-score-display');
        if (!highScoreDisplay) {
            highScoreDisplay = document.createElement('div');
            highScoreDisplay.className = 'high-score-display';
            document.body.appendChild(highScoreDisplay);
        }
        highScoreDisplay.textContent = `High Score: ${this.highScore}`;
    }

    endGame(reason) {
        if (this.gameOver) return;
        
        // Log all current speeds before reset
        console.log('Current Speeds Before Reset:', {
            planeCurrentSpeed: this.plane.speed,
            obstacleCurrentSpeed: this.obstacleSpeed,
            currentBaseSpeed: this.minSpeed,
            currentLevel: this.level,
            difficulty: this.difficulty,
            difficultySettings: {
                planeUpSpeed: -this.difficulties[this.difficulty].planeSpeed,
                planeDownSpeed: this.difficulties[this.difficulty].maxDownSpeed,
                planeGravity: this.difficulties[this.difficulty].gravity,
                baseSpeed: this.difficulties[this.difficulty].baseSpeed
            }
        });
        
        this.gameOver = true;
        
        // Reset all speeds to initial difficulty values
        const diffSettings = this.difficulties[this.difficulty];
        this.obstacleSpeed = diffSettings.baseSpeed;
        this.minSpeed = diffSettings.baseSpeed;
        this.plane.speed = 0;
        
        console.log('Speeds After Reset:', {
            planeSpeed: this.plane.speed,
            obstacleSpeed: this.obstacleSpeed,
            baseSpeed: this.minSpeed
        });
        
        // Stop all obstacle animations
        this.obstacles.forEach(obstacle => {
            obstacle.animation = 'none';
        });
        
        // Create and show final score display with restart button
        const finalScoreDisplay = document.createElement('div');
        finalScoreDisplay.className = 'final-score-display';
        
        // Add score text
        const scoreText = document.createElement('div');
        scoreText.textContent = `Final Score: ${Math.floor(this.score)}`;
        finalScoreDisplay.appendChild(scoreText);
        
        // Add restart button
        const restartButton = document.createElement('button');
        restartButton.className = 'restart-button';
        restartButton.textContent = 'Play Again';
        restartButton.onclick = () => {
            finalScoreDisplay.remove();
            this.resetGameState();
            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.style.display = 'flex';
            }
            const buttons = document.querySelectorAll('.difficulty-btn');
            buttons.forEach(btn => btn.classList.remove('selected'));
            const startButton = document.getElementById('startButton');
            if (startButton) {
                startButton.disabled = true;
                startButton.textContent = 'Select Difficulty to Start';
            }
        };
        finalScoreDisplay.appendChild(restartButton);
        
        document.body.appendChild(finalScoreDisplay);
    }

    update() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Calculate delta time
        const currentTime = Date.now();
        this.deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        // Update plane position with gravity
        const diffSettings = this.difficulties[this.difficulty];
        
        // Apply gravity if not holding up
        if (!this.controls.isUpPressed && !this.controls.isTouchActive) {
            this.plane.speed = this.controls.isDownPressed ? 
                diffSettings.maxDownSpeed : 
                diffSettings.gravity;
        }

        // Update plane position using delta time
        this.plane.y += this.plane.speed * this.deltaTime * 60;
        
        // Check for boundary collision
        if (this.plane.y <= 0) {
            console.log('Game Over: Plane crashed into ceiling!');
            this.endGame('ceiling');
            return;
        }
        
        if (this.plane.y + this.plane.height >= this.canvas.height) {
            console.log('Game Over: Plane crashed into floor!');
            this.endGame('floor');
            return;
        }
        
        // Update game state
        this.score += this.baseScoreRate * this.scoreMultiplier * this.deltaTime * 60;
        this.validateScore();
        this.updateLevel();
        this.updateObstacles();
        this.checkCollision();
        this.updateHighScore();
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game elements
        if (!this.gameOver) {
            // Draw obstacles and their destruction animations
            this.obstacles.forEach(obstacle => {
                if (obstacle.destroying) {
                    this.drawExplosion(obstacle);
                } else {
                    this.drawObstacle(obstacle);
                }
            });
        }
        
        // Always draw the plane, even when game is over
        this.drawPlane();
    }

    gameLoop() {
        if (!this.gameOver) {
            this.update();
        }
        this.draw();
        
        // Continue the game loop even when game is over, but don't update positions
        requestAnimationFrame(() => this.gameLoop());
    }

    updateColors() {
        // Define color schemes for each level with high contrast combinations
        const levelColors = [
            { bg: '#1a1a2e', plane: '#ffffff', obstacles: ['#ff6b6b', '#4ecdc4', '#ffe66d'] }, // Level 1: Dark blue
            { bg: '#2c3e50', plane: '#2ecc71', obstacles: ['#e74c3c', '#f1c40f', '#ecf0f1'] }, // Level 2: Navy
            { bg: '#8e44ad', plane: '#f1c40f', obstacles: ['#2ecc71', '#ecf0f1', '#e74c3c'] }, // Level 3: Purple
            { bg: '#2d3436', plane: '#55efc4', obstacles: ['#ffeaa7', '#ff7675', '#74b9ff'] }, // Level 4: Dark gray
            { bg: '#273c75', plane: '#ffd32a', obstacles: ['#e84118', '#7bed9f', '#70a1ff'] }, // Level 5: Dark blue
            { bg: '#6c5ce7', plane: '#00cec9', obstacles: ['#ffeaa7', '#ff7675', '#dfe6e9'] }, // Level 6: Purple
            { bg: '#d63031', plane: '#81ecec', obstacles: ['#ffeaa7', '#dfe6e9', '#6c5ce7'] }, // Level 7: Red
            { bg: '#0c2461', plane: '#ff7f50', obstacles: ['#7bed9f', '#ecf0f1', '#ff6b6b'] }, // Level 8: Navy
            { bg: '#2c3e50', plane: '#f39c12', obstacles: ['#e74c3c', '#3498db', '#2ecc71'] }, // Level 9: Dark gray
            { bg: '#1e272e', plane: '#ffa502', obstacles: ['#ff6b6b', '#2ecc71', '#74b9ff'] }  // Level 10+: Very dark
        ];

        const colorIndex = Math.min(this.level - 1, levelColors.length - 1);
        const scheme = levelColors[colorIndex];
        
        // Update canvas background color
        this.canvas.style.backgroundColor = scheme.bg;
        this.planeColor = scheme.plane;
        
        // Update the obstacle colors array
        this.colors = scheme.obstacles;
        
        console.log(`Color update for level ${this.level}:`, {
            background: scheme.bg,
            plane: scheme.plane,
            obstacles: scheme.obstacles,
            colorIndex: colorIndex
        });
    }

    updateObstacleAnimations(obstacle) {
        // Handle scale animation (already implemented)
        if (obstacle.animation === 'scale' || obstacle.animation === 'all') {
            obstacle.scale += 0.01 * obstacle.scaleDirection;
            if (obstacle.scale > 1.2 || obstacle.scale < 0.8) {
                obstacle.scaleDirection *= -1;
            }
        }
        
        // Handle spin animation
        if (obstacle.animation === 'spin' || obstacle.animation === 'all') {
            obstacle.animProps.rotation += obstacle.animProps.rotationSpeed;
            if (obstacle.animProps.rotation > Math.PI * 2) {
                obstacle.animProps.rotation -= Math.PI * 2;
            }
        }
        
        // Handle bounce animation
        if (obstacle.animation === 'bounce' || obstacle.animation === 'all') {
            obstacle.animProps.bounceOffset += obstacle.animProps.bounceSpeed * obstacle.animProps.bounceDirection;
            if (obstacle.animProps.bounceOffset > 30 || obstacle.animProps.bounceOffset < -30) {
                obstacle.animProps.bounceDirection *= -1;
            }
            obstacle.y = obstacle.animProps.originalY + obstacle.animProps.bounceOffset;
        }
        
        // Handle fall animation
        if (obstacle.animation === 'fall') {
            // Fall from top to bottom
            obstacle.y += 2;
            if (obstacle.y > this.canvas.height) {
                obstacle.y = -obstacle.height;
            }
        }
        
        // Handle rise animation
        if (obstacle.animation === 'rise') {
            // Rise from bottom to top
            obstacle.y -= 2;
            if (obstacle.y + obstacle.height < 0) {
                obstacle.y = this.canvas.height;
            }
        }
        
        // Handle jitter animation
        if (obstacle.animation === 'jitter' || obstacle.animation === 'all') {
            obstacle.animProps.jitterX = (Math.random() * 6) - 3;
            obstacle.animProps.jitterY = (Math.random() * 6) - 3;
        } else {
            obstacle.animProps.jitterX = 0;
            obstacle.animProps.jitterY = 0;
        }
    }

    checkCircleCollision(obstacle) {
        const circleX = obstacle.x + (obstacle.width * obstacle.scale) / 2 + obstacle.animProps.jitterX;
        const circleY = obstacle.y + (obstacle.height * obstacle.scale) / 2 + obstacle.animProps.jitterY;
        const radius = Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2;
        
        // Get plane corners
        const planeCorners = [
            { x: this.plane.x, y: this.plane.y },
            { x: this.plane.x + this.plane.width, y: this.plane.y },
            { x: this.plane.x, y: this.plane.y + this.plane.height },
            { x: this.plane.x + this.plane.width, y: this.plane.y + this.plane.height }
        ];
        
        // Check if any corner is inside the circle
        for (const corner of planeCorners) {
            const distance = Math.sqrt(
                Math.pow(corner.x - circleX, 2) + 
                Math.pow(corner.y - circleY, 2)
            );
            if (distance <= radius) {
                return true;
            }
        }
        
        return false;
    }

    checkPolygonCollision(obstacle) {
        const centerX = obstacle.x + (obstacle.width * obstacle.scale) / 2 + obstacle.animProps.jitterX;
        const centerY = obstacle.y + (obstacle.height * obstacle.scale) / 2 + obstacle.animProps.jitterY;
        const radius = Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2;
        
        // Generate polygon points
        const sides = obstacle.type === 'pentagon' ? 5 : 
                     (obstacle.type === 'octagon' ? 8 : 6); // hexagon is default
        
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = obstacle.animProps.rotation + (i * 2 * Math.PI / sides);
            points.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
        
        // Check if any corner of the plane is inside the polygon
        const planeCorners = [
            { x: this.plane.x, y: this.plane.y },
            { x: this.plane.x + this.plane.width, y: this.plane.y },
            { x: this.plane.x, y: this.plane.y + this.plane.height },
            { x: this.plane.x + this.plane.width, y: this.plane.y + this.plane.height }
        ];
        
        return planeCorners.some(corner => this.pointInPolygon(corner, points));
    }

    checkStarCollision(obstacle) {
        const centerX = obstacle.x + (obstacle.width * obstacle.scale) / 2 + obstacle.animProps.jitterX;
        const centerY = obstacle.y + (obstacle.height * obstacle.scale) / 2 + obstacle.animProps.jitterY;
        const outerRadius = Math.min(obstacle.width, obstacle.height) * obstacle.scale / 2;
        const innerRadius = outerRadius / 2;
        
        // Generate star points
        const points = [];
        for (let i = 0; i < 10; i++) {
            const angle = obstacle.animProps.rotation + (i * Math.PI / 5);
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            points.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
        
        // Check if any corner of the plane is inside the star
        const planeCorners = [
            { x: this.plane.x, y: this.plane.y },
            { x: this.plane.x + this.plane.width, y: this.plane.y },
            { x: this.plane.x, y: this.plane.y + this.plane.height },
            { x: this.plane.x + this.plane.width, y: this.plane.y + this.plane.height }
        ];
        
        return planeCorners.some(corner => this.pointInPolygon(corner, points));
    }

    checkDiamondCollision(obstacle) {
        const x = obstacle.x + obstacle.animProps.jitterX;
        const y = obstacle.y + obstacle.animProps.jitterY;
        const width = obstacle.width * obstacle.scale;
        const height = obstacle.height * obstacle.scale;
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Generate diamond points
        const points = [
            { x: centerX, y: y },
            { x: x + width, y: centerY },
            { x: centerX, y: y + height },
            { x: x, y: centerY }
        ];
        
        // Check if any corner of the plane is inside the diamond
        const planeCorners = [
            { x: this.plane.x, y: this.plane.y },
            { x: this.plane.x + this.plane.width, y: this.plane.y },
            { x: this.plane.x, y: this.plane.y + this.plane.height },
            { x: this.plane.x + this.plane.width, y: this.plane.y + this.plane.height }
        ];
        
        return planeCorners.some(corner => this.pointInPolygon(corner, points));
    }

    // Add a resetGameState method to the Game class
    resetGameState() {
        // Reset game variables
        this.score = 0;
        this.level = 1;
        this.obstaclesPassed = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.obstacles = [];
        
        // Reset plane position
        this.plane.y = this.canvas.height / 2;
        this.plane.speed = 0;
        
        // Reset UI elements
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('obstaclesPassed').textContent = '0';
        
        // Reset colors
        this.updateColors();
        
        // Reset all speeds to initial difficulty values
        if (this.difficulty) {
            const diffSettings = this.difficulties[this.difficulty];
            this.minSpeed = diffSettings.baseSpeed;
            this.obstacleSpeed = this.minSpeed;
            this.plane.speed = 0;
            this.scoreMultiplier = diffSettings.scoreMultiplier;
            
            console.log('Game Reset - Speeds:', {
                difficulty: this.difficulty,
                obstacleSpeed: this.obstacleSpeed,
                planeSpeed: this.plane.speed,
                baseSpeed: this.minSpeed
            });
        }
    }

    // Add startGame method
    startGame() {
        if (!this.difficulty) {
            console.error('No difficulty selected!');
            return;
        }

        console.log('Starting game with difficulty:', this.difficulty);
        this.resetGameState();
        this.gameStarted = true;
        
        // Hide start screen when game starts
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }
        
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }
}

// Update the restartGame function
function restartGame() {
    console.log('Restarting game...');
    
    // Show start screen with difficulty selection
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.style.display = 'flex';
    }
    
    // Reset difficulty selection
    const buttons = document.querySelectorAll('.difficulty-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    // Disable start button until difficulty is selected
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.disabled = true;
        startButton.textContent = 'Select Difficulty to Start';
    }
    
    // Create new game instance
    const game = new Game();
}

// Modified window.onload to check if elements exist
window.onload = () => {
    console.log('Window loaded');
    
    // Check if necessary elements exist
    const startButton = document.getElementById('startButton');
    const startScreen = document.getElementById('startScreen');
    const gameCanvas = document.getElementById('gameCanvas');
    
    if (!startButton) {
        console.error('Start button not found! Make sure you have an element with id="startButton"');
    }
    
    if (!startScreen) {
        console.error('Start screen not found! Make sure you have an element with id="startScreen"');
    }
    
    if (!gameCanvas) {
        console.error('Game canvas not found! Make sure you have an element with id="gameCanvas"');
    }
    
    // Only initialize the game if all elements exist
    if (startButton && startScreen && gameCanvas) {
        new Game();
        console.log('Game object created');
    } else {
        console.error('Game initialization failed due to missing elements');
    }

    // Add floating polygons after game initialization
    addFloatingPolygons();

    // Add this to your window.onload function
    function initializePandaEffects() {
        const pandas = document.querySelectorAll('.panda-image');
        
        pandas.forEach(panda => {
            panda.addEventListener('mouseover', () => {
                panda.style.transform = panda.classList.contains('left') ? 'rotate(-25deg) scale(1.1)' :
                                      panda.classList.contains('right') ? 'rotate(25deg) scale(1.1)' :
                                      'rotate(25deg) scale(1.1)';
                panda.style.opacity = '0.8';
            });
            
            panda.addEventListener('mouseout', () => {
                panda.style.transform = panda.classList.contains('left') ? 'rotate(-15deg)' :
                                      panda.classList.contains('right') ? 'rotate(15deg)' :
                                      'rotate(15deg)';
                panda.style.opacity = '0.15';
            });
        });
    }

    // Add this call to your window.onload function
    window.addEventListener('load', initializePandaEffects);
};

// Add floating polygons function
function addFloatingPolygons() {
    const startScreen = document.getElementById('startScreen');
    const shapes = ['⭐', '⬡', '⬢', '⬣', '△', '□'];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    
    for (let i = 0; i < 15; i++) {
        const polygon = document.createElement('div');
        polygon.className = 'floating-polygon';
        polygon.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        polygon.style.color = colors[Math.floor(Math.random() * colors.length)];
        polygon.style.fontSize = Math.random() * 30 + 20 + 'px';
        polygon.style.left = Math.random() * 100 + '%';
        polygon.style.top = Math.random() * 100 + '%';
        polygon.style.animationDelay = Math.random() * 5 + 's';
        startScreen.appendChild(polygon);
    }
} 
