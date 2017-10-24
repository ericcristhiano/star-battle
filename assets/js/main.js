/**
 * Constants used in game
 * @type {number}
 */
const SPACE_BAR = 32;
const LETTER_P = 80;
const MAX_FUEL = 30;

/**
 * Main class of game
 * Controls all things running
 */
class Game
{
    /**
     * Definition of properties that will be used
     */
    constructor() {
        this.objects = [];
        this._time = 0;
        this._score = 0;
        this._fuel = 15;
        this.isPaused = false;
        this.isFinished = false;
        this.isMuted = false;
        this.ship = null;
        this.interval = null;
        this.animation = null;
        this.frames = 0;
        this.backgroundSound = new Audio();
        this.shootSound = new Audio();
        this.destroyedSound = new Audio();
    }

    /**
     * Populate the respective sounds in properties
     */
    populateSounds() {
        this.backgroundSound.src = 'assets/sound/background.mp3';
        this.backgroundSound.loop = true;
        this.destroyedSound.src = 'assets/sound/destroyed.mp3';
        this.shootSound.src = 'assets/sound/shoot.mp3';
    }

    /**
     * Initialize the game
     */
    init() {
        this.populateSounds();
        this.bindHandlers();
        this.addShip();
    }

    /**
     * Add the main spaceship in game
     */
    addShip() {
        this.ship = new Ship(this);
        this.ship.bindHandlers();
        this.objects.push(this.ship);
    }

    /**
     * Bind all handlers (click, keydown) on respective methods
     */
    bindHandlers() {
        $('.btn-start').on('click', e => {
            $('.btn-start').blur();
            this.startGame();
            $('.instructions').removeClass('active');
        });

        $('.btn-mute').on('click', e => {
            $('.btn-mute').blur();
            this.checkIsMuted();
        });

        $('.btn-pause').on('click', e => {
            $('.btn-pause').blur();
            this.checkIsPaused();
        });

        $(document).on('keydown', e => {
            if (e.keyCode === LETTER_P) {
                this.checkIsPaused();
            }
        });

        $('.increase-font').on('click', e => {
            this.increaseFonts();
        });

        $('.decrease-font').on('click', e => {
            this.decreaseFonts();
        });

        $('.name').on('keyup', e => {
            if ($('.name').val().trim()) {
                $('.btn-continue').prop('disabled', false);
            } else {
                $('.btn-continue').prop('disabled', true);
            }
        });

        $('.form-modal form').on('submit', e => {
            e.preventDefault();

            $.post('https://star-battle-ranking.herokuapp.com/register.php', {
                name: $('.name').val().trim(),
                score: this.score,
                time: this.time
            }).done(data => {
                this.showRanking(JSON.parse(data));
            })
        });

        $('.btn-restart').on('click', e => {
            location.reload();
        });
    }

    /**
     * Sort and show the ranking table from data coming from database
     *
     * @param json
     */
    showRanking(json) {
        let html = '';

        json.sort((a, b) => {
            if (a.score === b.score) {
                return b.time - a.time;
            }

            return b.score - a.score;
        });

        let pos = 1;

        for (let i = 0; i < json.length; i++) {
            html += `<tr>
                        <td>${pos}</td>
                        <td>${json[i].name}</td>
                        <td>${json[i].score}</td>
                        <td>${json[i].time}</td>
                    </tr>`;

            if ((json[i + 1]) && (json[i].score !== json[i + 1].score || json[i].time !== json[i + 1].time)) {
                pos++;
            }
        }

        $('.ranking-modal tbody').html(html);

        $('.ranking-modal').addClass('active');
    }

    /**
     * Increase the fonts of game
     */
    increaseFonts() {
        if (this.isFinished || this.isPaused) return;

        $('[data-size]').each(function() {
            let size = parseInt($(this).attr('data-size'));
            size += 2;
            $(this).attr('data-size', size);
            $(this).css('font-size', size + 'px');
        });
    }

    /**
     * Decrease the fonts of game
     */
    decreaseFonts() {
        if (this.isFinished || this.isPaused) return;

        $('[data-size]').each(function() {
            let size = parseInt($(this).attr('data-size'));
            size -= 2;
            $(this).attr('data-size', size);
            $(this).css('font-size', size + 'px');
        });
    }

    /**
     * Start the game
     * Its called when user clicks on start game
     */
    startGame() {
        this.startLoop();
        this.startInterval();
        this.startBackgroundSound();
        this.startAnimations();
    }

    /**
     * Start the background sound in loop
     */
    startBackgroundSound() {
        this.backgroundSound.play();
    }

    /**
     * Stop the background sound
     */
    stopBackgroundSound() {
        this.backgroundSound.pause();
    }

    /**
     * Play the shoot sound
     */
    playShootSound() {
        if (!this.isMuted) {
            const clone = this.shootSound.cloneNode();
            clone.play();
        }
    }

    /**
     * Play the destroyed sound
     */
    playDestroyedSound() {
        if (!this.isMuted) {
            const clone = this.destroyedSound.cloneNode();
            clone.play();
        }
    }

    /**
     * Start the animations of objects in screen
     */
    startAnimations() {
        $('.bg, .enemy, .friend, .ship, .asteroid, .fuel').addClass('animate');
    }

    /**
     * Stop the animations of objects in screen
     */
    stopAnimations() {
        $('.bg, .enemy, .friend, .ship, .asteroid, .fuel').removeClass('animate');
    }

    /**
     * Getter for fuel
     *
     * @returns {number|*}
     */
    get fuel() {
        return this._fuel;
    }

    /**
     * Setter for fuel
     *
     * @param fuel
     */
    set fuel(fuel) {
        this._fuel = fuel;

        if (this._fuel > 30) {
            this._fuel = 30;
        }

        if (this._fuel <= 0) {
            this._fuel = 0;
            this.endGame();
        }

        this.updateFuel();
    }

    /**
     * Update the fuel in screen
     */
    updateFuel() {
        $('.bar span').html(this.fuel);
        $('.bar .inner').width((this.fuel * 100 / MAX_FUEL) + '%');
    }

    /**
     * Getter for score
     *
     * @returns {number|*}
     */
    get score() {
        return this._score;
    }

    /**
     * Setter for score
     *
     * @param score
     */
    set score(score) {
        this._score = score;
        this.updateScore();
    }

    /**
     * Getter for time
     *
     * @returns {number|*}
     */
    get time() {
        return this._time;
    }

    /**
     * Setter for time
     *
     * @param time
     */
    set time(time) {
        this._time = time;
        this.updateTime();
    }

    /**
     * Update the score in screen
     */
    updateScore() {
        $('.score span').html(this.score);
    }

    /**
     * Update the time in screen
     */
    updateTime() {
        $('.timer span').html(this.time);
    }

    /**
     * End the game
     * Stop all sounds and interactions
     */
    endGame() {
        this.stopLoop();
        this.stopAnimations();
        this.stopInterval();
        $('.form-modal').addClass('active');
        this.isFinished = true;
        this.stopBackgroundSound();
    }

    /**
     * Main loop of game
     * Update the objects positions
     * Verify is there is a collision
     */
    loop() {
        this.animation = window.requestAnimationFrame(() => {
            this.loop();
            this.updateObjects();
            this.drawObjects();
            this.checkCollisionBetweenObjects();
            this.addRandomElementInScreen();
            this.frames++;
        });
    }

    /**
     * Add a random object in a random position in screen
     */
    addRandomElementInScreen() {
        if (this.frames % 100 === 0) {
            this.objects.push(new Friend(this));
        }

        if (this.frames % 150 === 0) {
            this.objects.push(new Asteroid(this));
        }

        if (this.frames % 250 === 0) {
            this.objects.push(new Enemy(this));
        }

        if (this.frames % 350 === 0) {
            this.objects.push(new Fuel(this));
        }
    }

    /**
     * Return a random number between min and max
     *
     * @param min
     * @param max
     * @returns {number}
     */
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * Start the main loop of game
     */
    startLoop() {
        this.loop();
    }

    /**
     * Stop the main loop of game
     * Used in pause and finish
     */
    stopLoop() {
        window.cancelAnimationFrame(this.animation);
    }

    /**
     * Start the interval to count fuel and time
     */
    startInterval() {
        this.interval = window.setInterval(() => {
            this.fuel--;
            this.time++;
        }, 1000);
    }

    /**
     * Stop the interval
     */
    stopInterval() {
        window.clearInterval(this.interval);
    }

    /**
     * Update the objects in screen
     */
    updateObjects() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].update();
        }
    }

    /**
     * Draw the objects in respective positions in screen
     */
    drawObjects() {
        for (let i = 0; i < this.objects.length; i++) {
            this.objects[i].draw();
        }
    }

    /**
     * Check if there is a collision between all objects in screen
     */
    checkCollisionBetweenObjects() {
        for (let i = 0; i < this.objects.length; i++) {
            const obj1 = this.objects[i];
            if (!(obj1 instanceof Collidable)) continue;

            for (let j = i + 1; j < this.objects.length; j++) {
                const obj2 = this.objects[j];
                if (!(obj2 instanceof Collidable)) continue;
                obj1.checkCollision(obj2);
            }
        }
    }

    /**
     * Check if the game is paused
     * If it is, continue. Otherwise pause
     */
    checkIsPaused() {
        if (this.isFinished) return;

        if (this.isPaused) {
            this.continueGame();
        } else {
            this.pauseGame();
        }

        this.isPaused = !this.isPaused;
    }

    /**
     * Check if the game is muted
     * If it is, unmute. Otherwise mute
     */
    checkIsMuted() {
        if (this.isFinished || this.isPaused) return;

        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }

        this.isMuted = !this.isMuted;
    }

    /**
     * Mute the game
     */
    mute() {
        this.backgroundSound.volume = 0;
        $('.btn-mute img').attr('src', 'assets/img/unmute.png');
    }

    /**
     * Unmute the game
     */
    unmute() {
        this.backgroundSound.volume = 1;
        $('.btn-mute img').attr('src', 'assets/img/mute.png');
    }

    /**
     * Pause the game
     * Stop all interactions and sounds
     */
    pauseGame() {
        this.stopAnimations();
        this.stopInterval();
        this.stopLoop();
        $('.btn-pause img').attr('src', 'assets/img/play.png');
        this.backgroundSound.volume = 0;
    }

    /**
     * Continue the game
     * Returns all interactions and sounds
     */
    continueGame() {
        this.startAnimations();
        this.startInterval();
        this.startLoop();
        $('.btn-pause img').attr('src', 'assets/img/pause.png');
        if (!this.isMuted) {
            this.backgroundSound.volume = 1;
        }
    }
}

/**
 * Class to be extended by elements that will be drawn in screen
 */
class Drawable
{
    /**
     * Properties of class
     * Positions, instance of game and element
     *
     * @param $el
     * @param x
     * @param y
     * @param game
     */
    constructor($el, x, y, game) {
        this.$el = $el;
        this.x = x;
        this.y = y;
        this.game = game;
        this.stepX = 0;
        this.stepY = 0;
    }

    /**
     * Update the current position using stepX and stepY
     */
    update() {
        this.x += this.stepX;
        this.y += this.stepY;

        if (this.x >= 980 || this.y >= 620 || this.x <= -100 || this.y <= -100) {
            this.remove();
        }
    }

    /**
     * Draw the element in its position in screen
     */
    draw() {
        this.$el.css('transform', `translate(${this.x}px, ${this.y}px)`);
    }

    /**
     * Remove the element of game
     */
    remove() {
        const index = this.game.objects.indexOf(this);
        this.$el.remove();
        this.game.objects.splice(index, 1);
    }
}

/**
 * Class to be extended by all collidable elements
 */
class Collidable extends Drawable
{
    /**
     * Properties to be sent to drawable
     *
     * @param $el
     * @param x
     * @param y
     * @param game
     */
    constructor($el, x, y, game) {
        super($el, x, y, game)
    }

    /**
     * Return if there is a collision with obj (logic isolation)
     *
     * @param obj
     * @returns {boolean}
     */
    isCollision(obj) {
        const thisCoord = {
            x1: this.x,
            x2: this.x + this.$el.width(),
            y1: this.y,
            y2: this.y + this.$el.height(),
        };

        const objCoord = {
            x1: obj.x,
            x2: obj.x + obj.$el.width(),
            y1: obj.y,
            y2: obj.y + obj.$el.height(),
        };

        return (!(
            (thisCoord.x1 > objCoord.x2 || thisCoord.x2 < objCoord.x1) ||
            (thisCoord.y1 > objCoord.y2 || thisCoord.y2 < objCoord.y1)
        ));
    }

    /**
     * Check if there is a collision with obj
     *
     * @param obj
     */
    checkCollision(obj) {
        if (this.isCollision(obj)) {
            this.collide(obj);
            obj.collide(this);
        }
    }

    /**
     * Method to be override by children classes
     *
     * @param obj
     */
    collide(obj) {
        // Implement the behavior of collision here
    }
}

/**
 * Class to represent the user spaceship
 */
class Ship extends Collidable {
    constructor(game) {
        const $el = $(`<div class="ship">
                        <div class="image"></div>
                    </div>`);
        const x = 220;
        const y = 266;
        $('.game-elements').append($el);
        super($el, x, y, game);
        this.keys = {};
        this.isSpacePressed = false;
    }

    /**
     * Binds the movement of spaceship
     */
    bindHandlers() {
        const that = this;

        $('.sensible-area').on('mouseover', function(e) {
            if (that.game.isFinished || that.game.isPaused) return;

            if ($(this).hasClass('top')) {
                that.keys.top = true;
                that.$el.find('.image').css('transform', 'rotate(-10deg)');
            }

            if ($(this).hasClass('bottom')) {
                that.keys.bottom = true;
                that.$el.find('.image').css('transform', 'rotate(10deg)');
            }

            if ($(this).hasClass('left')) {
                that.keys.left = true;
                that.$el.find('.image').css('transform', 'rotate(-5deg)');
            }

            if ($(this).hasClass('right')) {
                that.keys.right = true;
                that.$el.find('.image').css('transform', 'rotate(5deg)');
            }
        });

        $('.sensible-area').on('mouseout', function(e) {
            that.keys = {};
            that.stepX = 0;
            that.stepY = 0;
            that.$el.find('.image').css('transform', 'rotate(0deg)');
        });

        $(document).on('keydown', e => {
            if (e.keyCode === SPACE_BAR) {
                this.shoot();
            }
        });

        $(document).on('keyup', e => {
            if (e.keyCode === SPACE_BAR) {
                this.isSpacePressed = false;
            }
        });
    }

    /**
     * Overriding to move the spaceship
     */
    update() {
        if (this.x <= 5) {
            this.x = 5;
        }

        if (this.y <= 28) {
            this.y = 28;
        }

        if (this.y >= 505) {
            this.y = 505;
        }

        if (this.keys.top) {
            this.stepY = -5;
        }

        if (this.keys.bottom) {
            this.stepY = 5;
        }

        if (this.keys.left) {
            this.stepX = -5;
        }

        if (this.keys.right) {
            this.stepX = 5;
        }

        if (this.x >= 805) {
            this.x = 805;
        }

        super.update();
    }

    /**
     * Shoot when user presses spacebar
     */
    shoot() {
        if (this.game.isFinished || this.game.isPaused) return;

        if (!this.isSpacePressed) {
            this.game.objects.push(new Bullet(this.x + this.$el.width() / 2, this.y + this.$el.height() / 2, this.game, this));
            this.isSpacePressed = true;
            this.game.playShootSound();
        }
    }

    /**
     * Logic of all collision with main spaceship
     *
     * @param obj
     */
    collide(obj) {
        if (obj instanceof Fuel) {
            this.game.fuel += 15;
            obj.remove();
        }

        if (obj instanceof Asteroid || obj instanceof Enemy || obj instanceof Friend) {
            this.game.fuel -= 15;
            obj.remove();
        }

        if (obj instanceof Bullet && obj.belongsTo instanceof Enemy) {
            obj.remove();
            this.game.fuel -= 15;
        }
    }
}

/**
 * Class to represent fuel
 */
class Fuel extends Collidable {
    constructor(game) {
        const $el = $(`<div class="fuel animate">
                        <div class="image"></div>
                    </div>`);
        const x = game.randomNumber(10, 880);
        const y = -80;
        $('.game-elements').append($el);
        super($el, x, y, game);
        this.stepY = 5;
        this.keys = {};
    }
}

/**
 * Class to represent enemy
 */
class Enemy extends Collidable {
    constructor(game) {
        const $el = $(`<div class="enemy animate">
                        <div class="image"></div>
                    </div>`);
        const x = 980;
        const y = game.randomNumber(10, 520);
        $('.game-elements').append($el);
        super($el, x, y, game);
        this.stepX = -5;
        this.keys = {};
    }

    /**
     * Overriding to shoot
     */
    update() {
        super.update();

        if (this.game.frames % 60 === 0) {
            this.shoot();
        }
    }

    /**
     * Shoot
     */
    shoot() {
        this.game.objects.push(new Bullet(this.x + this.$el.width() / 2, this.y + this.$el.height() / 2, this.game, this));
    }

    /**
     * Collisions logic with other objects
     *
     * @param obj
     */
    collide(obj) {
        if (obj instanceof Bullet && obj.belongsTo instanceof Ship) {
            this.game.score += 5;
            this.remove();
            obj.remove();
            this.game.playDestroyedSound();
            this.game.objects.push(new Explosion(this.x, this.y, this.game));
        }
    }
}

/**
 * Class to represent friend
 */
class Friend extends Collidable {
    constructor(game) {
        const $el = $(`<div class="friend animate">
                        <div class="image"></div>
                    </div>`);
        const x = 980;
        const y = game.randomNumber(10, 520);
        $('.game-elements').append($el);
        super($el, x, y, game);
        this.stepX = -5;
        this.keys = {};
    }

    /**
     * Collisions logic
     *
     * @param obj
     */
    collide(obj) {
        if (obj instanceof Bullet && obj.belongsTo instanceof Ship) {
            this.game.score -= 10;
            this.remove();
            obj.remove();
            this.game.playDestroyedSound();
            this.game.objects.push(new Explosion(this.x, this.y, this.game));
        }
    }
}

/**
 * Class to represent asteroid
 */
class Asteroid extends Collidable {
    constructor(game) {
        const $el = $(`<div class="asteroid animate">
                        <div class="image"></div>
                    </div>`);
        const x = 980;
        const y = game.randomNumber(10, 520);
        $('.game-elements').append($el);
        super($el, x, y, game);
        this.stepX = -5;
        this.keys = {};
        this.shoots = 0;
    }

    /**
     * Collisions logic
     *
     * @param obj
     */
    collide(obj) {
        if (obj instanceof Bullet && obj.belongsTo instanceof Ship) {
            this.shoots++;
            obj.remove();

            if (this.shoots >= 2) {
                this.remove();
                this.game.playDestroyedSound();
                this.game.objects.push(new Explosion(this.x, this.y, this.game));
                this.game.score += 10;
            }
        }
    }
}

/**
 * Class to represent bullet
 */
class Bullet extends Collidable {
    constructor(x, y, game, belongsTo) {
        const $el = $(`<div class="bullet"></div>`)
        super($el, x, y, game);
        this.belongsTo = belongsTo;
        this.stepX = 7;

        if (belongsTo instanceof Enemy) {
            $el.addClass('enemy-bullet');
            this.stepX = -8;
        }

        $('.game-elements').append($el);
    }
}

/**
 * Class to represent explosion
 */
class Explosion extends Drawable {
    constructor(x, y, game) {
        const $el = $(`<div class="explosion">
                        <div class="image"></div>
                    </div>`);
        $('.game-elements').append($el);
        setTimeout(() => {
            this.remove();
        }, 550);
        super($el, x, y, game);
    }
}

/**
 * Game initalizing
 *
 * @type {Game}
 */
const game = new Game();
game.init();