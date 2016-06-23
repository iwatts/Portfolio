/**
 * Created by isaacwatts on 6/13/16.
 */
var fish;
var mines;
var currentState;

var canvas;
var renderingContext;

var width;
var height;
var foregroundPosition = 0;
var backgroundPosition = 0;
var frames = 0;

var okButton;
var playButton;
var score = 0;
var total = 0;

var states = {
    Splash: 0,
    Game: 1,
    Score: 2
};

function Fish() {
    this.x = 140;
    this.y = 0;

    this.frame = 0;
    this.velocity = 0;
    this.animation = [0, 1, 2, 1];

    this.rotation = 0;
    this.radius = 12;

    this.gravity =  0.25;
    this._jump = 3.6;

    this.jump = function () {
        this.velocity = -this._jump;
    };

    this.update = function () {
        //animation speed in splash vs active game
        var n = currentState === states.Splash ? 10 : 5;

        this.frame += frames % n === 0 ? 1 : 0;
        this.frame %= this.animation.length;

        if (currentState === states.Splash) {
            this.updateIdleFish();
        } else {
            //Active game speed
            this.updatePlayingFish()
        }
    };

    this.updateIdleFish = function () {
        this.y = height - 280 + 5 * Math.cos(frames / 10);
        this.rotation = 0;
    };

    this.updatePlayingFish = function () {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Change to the score state when fish touches the ground
        if (this.y >= height - foregroundSprite.height - 10) {
            this.y = height - foregroundSprite.height - 10;

            if (currentState === states.Game) {
                currentState = states.Score;
            }

            this.velocity = this._jump; // Set velocity to jump speed for correct rotation
        }

        // If our player hits the top of the canvas, we crash him
        if (this.y <= 2) {
            currentState = states.Score;
        }

        // When fish lacks upward momentum increment the rotation angle
        if (this.velocity >= this._jump) {
            this.frame = 1;
            this.rotation = Math.min(Math.PI / 2, this.rotation + 0.3);
        } else {
            this.rotation = -0.3;
        }
    };

    this.draw = function (renderingContext) {
        renderingContext.save();

        // translate and rotate renderingContext coordinate system
        renderingContext.translate(this.x, this.y);
        renderingContext.rotate(this.rotation);

        var n = this.animation[this.frame];

        // draws the fish with center in
        fishSprite[n].draw(renderingContext, -fishSprite[n].width / 2, -fishSprite[n].height / 2);

        renderingContext.restore();
    }
}
function mine() {
    this.x = 500;
    this.y = height - (bottomCoralSprite.height + foregroundSprite.height + 120 + 200 * Math.random());
    this.width = bottomCoralSprite.width;
    this.height = bottomCoralSprite.height;

    /**
     * Determines if the fish has collided with the Coral.
     * Calculates x/y difference and use normal vector length calculation to determine
     */
    this.detectCollision = function () {
        // intersection
        var cx = Math.min(Math.max(fish.x, this.x), this.x + this.width);
        var cy1 = Math.min(Math.max(fish.y, this.y), this.y + this.height);
        var cy2 = Math.min(Math.max(fish.y, this.y + this.height + 110), this.y + 2 * this.height + 80);
        // Closest difference
        var dx = fish.x - cx;
        var dy1 = fish.y - cy1;
        var dy2 = fish.y - cy2;
        // Vector length
        var d1 = dx * dx + dy1 * dy1;
        var d2 = dx * dx + dy2 * dy2;
        var r = fish.radius * fish.radius;
        // Determine intersection
        if (r > d1 || r > d2) {
            currentState = states.Score;
        }
    };

    this.draw = function () {
        bottomCoralSprite.draw(renderingContext, this.x, this.y);
        topCoralSprite.draw(renderingContext, this.x, this.y + 110 + this.height);
    }
}

function mineCollection() {
    this._mines = [];

    this.reset = function () {
        this._mines = [];
    };

    this.add = function () {
        this._mines.push(new mine());
    };

    this.update = function () {
        if (frames % 100 === 0) {
            this.add();
        }

        for (var i = 0, len = this._mines.length; i < len; i++) {
            var mine = this._mines[i];

            if (i === 0) {
                mine.detectCollision();
            }

            mine.x -= 2;
            if (mine.x < -mine.width) {
                this._mines.splice(i,1);
                i--;
                len--;

            }
        }
    }
    this.draw = function () {
        for (var i = 0, len = this._mines.length; i < len; i++) {
            var mine = this._mines[i];
            mine.draw();
        }
    }
}

function onpress(evt) {
    switch (currentState) {

        case states.Splash: // Start the game and update the fish velocity.
            var mouseX = evt.offsetX, mouseY = evt.offsetY;

            if (mouseX == null || mouseY == null) {
                mouseX = evt.touches[0].clientX;
                mouseY = evt.touches[0].clientY;
            }

            // Check if within the playButton
            if (playButton.x < mouseX && mouseX < playButton.x + playButton.width &&
                playButton.y < mouseY && mouseY < playButton.y + playButton.height
            ) {
                currentState = states.Game;
                fish.jump();
                score ++;
            }

            break;

        case states.Game: // The game is in progress. Update fish velocity.
            fish.jump();
            score ++;
            break;

        case states.Score:
            // Change from score to splash state if event within okButton bounding box
            // Get event position
            var mouseX = evt.offsetX, mouseY = evt.offsetY;
			total = score;
			score = 0;
            console.log(total);

            if (mouseX == null || mouseY == null) {
                mouseX = evt.touches[0].clientX;
                mouseY = evt.touches[0].clientY;
            }

            // Check if within the okButton
            if (okButton.x < mouseX && mouseX < okButton.x + okButton.width &&
                okButton.y < mouseY && mouseY < okButton.y + okButton.height
            ) {
                //console.log('click');
                //mines.reset();
                currentState = states.Splash;
            }
            break;
    }
}

function windowSetup() {
    width = window.innerWidth;
    height = window.innerHeight;
    var inputEvent = "touchstart";

    // Game set for mobile, if on desktop, change settings to run
    if (width >= 500) {
        width = 380;
        height = 430;
        inputEvent = "mousedown";
    }

    // on input event listener
    document.addEventListener(inputEvent, onpress);
}

function canvasSetup() {
    canvas = document.createElement("canvas");
    canvas.style.border = '10px solid #000';
    canvas.width = width;
    canvas.height =  height;
    renderingContext = canvas.getContext("2d");
}

function loadGraphics() {
    var img = new Image();
    img.src = "img/sheet.png";
    img.onload = function () {
        initSprites(this);
        renderingContext.fillStyle = backgroundSprite.color;
        renderingContext.fillRect(0, 0, width, height);
        //fishSprite[0].draw(renderingContext, 5, 5, 142, 50);

        okButton = {
            x: (width - okButtonSprite.width) / 2,
            y: height - 200,
            width: okButtonSprite.width,
            height: okButtonSprite.height
        };

        playButton = {
            x: (width - playButtonSprite.width) / 2,
            y: height - 200,
            width: playButtonSprite.width,
            height: playButtonSprite.height
        };

        gameLoop();
    }
}

function main() {
    windowSetup();
    canvasSetup();

    currentState = states.Splash;

    document.body.appendChild(canvas);

    fish = new Fish();
    //mines = new mineCollection();

    loadGraphics();
}

function gameLoop() {
    update();
    render();
    window.requestAnimationFrame(gameLoop);
}

function update() {
    frames++;

    if (currentState !== states.Score) {
        foregroundPosition = (foregroundPosition - 2) % 224; // Move left two px each frame. Wrap every 14px.
        backgroundPosition = (backgroundPosition - 0.3) % 274; // Move left 3/10ths px each frame. Wrap every 275px.

    }

    if (currentState === states.Game) {
        //mines.update();
    }

    fish.update();

}

function render() {
    // Draw background color
    renderingContext.fillRect(0, 0, width, height);

    // Draw background sprites
    backgroundSprite.draw(renderingContext, backgroundPosition, 0);
    backgroundSprite.draw(renderingContext, backgroundPosition, backgroundSprite.height);
	backgroundSprite.draw(renderingContext, backgroundPosition + backgroundSprite.width - 1, 0);
	backgroundSprite.draw(renderingContext, backgroundPosition + backgroundSprite.width - 1, backgroundSprite.height);
    backgroundSprite.draw(renderingContext, backgroundPosition + (backgroundSprite.width * 2) - 1, 0);
	backgroundSprite.draw(renderingContext, backgroundPosition + (backgroundSprite.width * 2) - 1, backgroundSprite.height);

    fish.draw(renderingContext);

    if (currentState === states.Score) {
        okButtonSprite.draw(renderingContext, okButton.x, okButton.y);
    }
    if (currentState === states.Splash) {
        playButtonSprite.draw(renderingContext, playButton.x, playButton.y);
    }

    foregroundSprite.draw(renderingContext, foregroundPosition, height - foregroundSprite.height);
    foregroundSprite.draw(renderingContext, foregroundPosition + foregroundSprite.width, height - foregroundSprite.height);
	foregroundSprite.draw(renderingContext, foregroundPosition + (foregroundSprite.width * 2), height - foregroundSprite.height);

}
