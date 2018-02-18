function Snek(mainController){

    var _this = this;

    this.container = $('.snekContainer');
    this.food = null;
    this.head = null;

    this.segments = 2;
    this.direction = "R";
    this.speed = 8;


    this.setStartPositions = function(data){
        console.log(mainController.playerColor);
    };

    /**
     * Start the game
     */
    this.start = function(){

        // Create food element
        this.container.append('<div class="food"></div>');
        this.food = this.food = $('.food');
        this.food.css({top: -100, left: -100});

        // Create snake element
        this.container.append('<div id="head" class="bodyPart"></div>');
        this.head = this.head = $('#head');

        for (i = 0; i < this.segments; i++) {

            this.container.append('<div id="bodyPart_' + i + '" class="bodyPart"></div>');

            if (i === 0) {
                $bodyPart = this.head;
            } else {
                $bodyPart = $('#bodyPart_' + (i - 1));
            }

            $("#bodyPart_" + i).css({top: $bodyPart.position().top, left: ($bodyPart.position().left - 10)});
        }

        this.startKeyListeners();
        this.moveParts();
    };

    /**
     * Move own body parts
     */
    this.moveParts = function() {
        var config = {
            direction: null,
            type: null
        };

        switch (this.direction) {
            case 'L':
                config.direction = 'X';
                config.type = 0;
                break;

            case 'R':
                config.direction = 'X';
                config.type = 1;
                break;

            case 'U':
                config.direction = 'Y';
                config.type = 0;
                break;

            case 'D':
                config.direction = 'Y';
                config.type = 1;
                break;

            default:
                return; // exit this handler for other keys
        }

        var oldX = null;
        var oldY = null;

        $('.bodyPart').each(function (i) {
            i = i - 1;

            var newX = null;
            var newY = null;

            var tmpX = $(this).position().left;
            var tmpY = $(this).position().top;

            if (i < 0) {
                newX = $(this).position().left;
                newY = $(this).position().top;

                if (config.direction === "X") {
                    if (config.type) newX += 10;
                    else newX -= 10;
                } else {
                    if (config.type) newY += 10;
                    else newY -= 10;
                }

            } else if (i === 0) {
                newX = oldX;
                newY = oldY;
            } else {
                newX = oldX;
                newY = oldY;
            }

            $(this).css({top: newY, left: newX});

            oldX = tmpX;
            oldY = tmpY;

        });

        $('.bodyPart').show();

        this.edgeDetection();

    };

    /**
     * Detect if snake hit edges
     */
    this.edgeDetection = function(){
        var X = parseInt(this.head.position().left);
        var Y = parseInt(this.head.position().top);
        var dead = null;

        if (X < 0 ||
            X > this.container.width() ||
            Y < 0 ||
            Y > this.container.height()) {
            dead = 1;
        }


        $('.bodyPart').each(function () {
            if ($(this).attr('id') !== 'head') {
                if (X === $(this).position().left && Y === $(this).position().top) {
                    dead = 1;
                    return;
                }
            }
        });

        if( ! dead){
            this.foodDetect();
        }
    };

    /**
     * Detect if snake hit food
     * Repeats game loop
     */
    this.foodDetect = function(){

        var headX = parseInt(this.head.position().left);
        var headY = parseInt(this.head.position().top);
        var foodX = parseInt(this.head.position().left);
        var foodY = parseInt(this.head.position().top);

        if (headX === foodX && headY === foodY) {
            //collectedFood();
        }

        setTimeout(function () {
            _this.moveParts();
        }, (10 * this.speed));
    };

    /**
     * Start WASD / Arrow keys listener
     */
    this.startKeyListeners = function(){
        /**
         * Keydown event listner
         */
        $(document).keydown(function (e) {
            switch (e.which) {
                case 37: case 65: // left
                if (_this.direction !== 'R')
                    _this.direction = "L";
                break;

                case 38: case 87: // up
                if (_this.direction !== 'D')
                    _this.direction = "U";
                break;

                case 39: case 68: // right
                if (_this.direction !== 'L')
                    _this.direction = "R";
                break;

                case 40: case 83: // down
                if (_this.direction !== 'U')
                    _this.direction = "D";
                break;

                default:
                    return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });
    }

}