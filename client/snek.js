function Snek(mainController){

    var _this = this;

    this.container = $('.snekContainer');
    this.food = null;
    this.head = null;

    this.segments = 2;
    this.direction = "R";
    this.speed = 8;
    this.deadPlayers = [];

    this.foodElem = null;

    /**
     * Set start positions
     *
     * @param data
     */
    this.setStartPositions = function(data){

        this.placeHeads(data);
        this.createFoodElement();
        this.placeBodyParts(data);
        this.startMobileKeyListeners();
        this.startKeyListeners();
    };

    /**
     * Create food elems
     */
    this.createFoodElement = function(){
        this.container.append('<div class="food"></div>');
        this.foodElem = $('.food');
        this.foodElem.css({top: -100, left: -100});
    };

    this.getNewFood = function(position){
        this.foodElem.css('left', position.x + 'px');
        this.foodElem.css('top', position.y + 'px');
    };

    this.spawnNewSegmentForPlayer = function(key, data){
        if(key === mainController.client.socketSessionId)
            _this.container.append('<div id="bodyPart_' + key + '_'+ (data[key].segments - 1) +'" class="bodyPart self tail tail_'+key+'" style="background-color:#'+data[key].color+';"></div>');
        else
            _this.container.append('<div id="bodyPart_' + key + '_'+ (data[key].segments - 1) +'" class="bodyPart tail tail_'+key+'" style="background-color:#'+data[key].color+';"></div>');
    };
    /**
     * Place snek heads
     *
     * @param data
     */
    this.placeHeads = function(data){
        Object.keys(data).forEach(function(key, val) {
            var style = "left:" + data[key].posx + "px;top:" + data[key].posy + "px;";

            if(key === mainController.client.socketSessionId)
                _this.container.append('<div id="head_'+key+'" class="head bodyPart self head_'+key+'" style=' + style + '></div>');
            else
                _this.container.append('<div id="head_'+key+'"class="head bodyPart head_'+key+'" style=' + style + '></div>');
        });
    };

    /**
     * Place snek body parts
     *
     * @param data
     */
    this.placeBodyParts = function(data){
        Object.keys(data).forEach(function(key, val) {
            var prevPart = null;
            for(i=0; i < data[key].segments; i++)
            {
                if(key === mainController.client.socketSessionId)
                    _this.container.append('<div id="bodyPart_' + key + '_'+ i +'" class="bodyPart self tail tail_'+key+'" style="background-color:#'+data[key].color+';"></div>');
                else
                    _this.container.append('<div id="bodyPart_' + key + '_'+ i +'" class="bodyPart tail tail_'+key+'" style="background-color:#'+data[key].color+';"></div>');

                if(i === 0){
                    prevPart = $('.head_'+key);
                }else{
                    prevPart = $('#bodyPart_'+ key +'_'+ (i-1));
                }

                var positions = _this.getBodyPartPositionBasedOnDirection(data[key].direction, prevPart);

                $('#bodyPart_'+ key +'_'+ i).css({top: positions.top, left: positions.left});
            }
        });
    };

    /**
     * Get the bodypart position based on direction
     *
     * @param direction
     * @param prevPart
     * @returns {{left: null, top: null}}
     */
    this.getBodyPartPositionBasedOnDirection = function(direction, prevPart){
        var bodyPartPosition = {
            left: null,
            top: null
        };

        switch(direction){
            case 'R':
                bodyPartPosition = {
                    'left' : (prevPart.position().left - 10),
                    'top' :  prevPart.position().top
                };
            break;

            case 'L':
                bodyPartPosition = {
                    'left' : (prevPart.position().left + 10),
                    'top' :  prevPart.position().top
                };
            break;

            case 'U':
                bodyPartPosition = {
                    'left' : prevPart.position().left,
                    'top' :  (prevPart.position().top + 10)
                };
            break;

            case 'D':
                bodyPartPosition = {
                    'left' : prevPart.position().left,
                    'top' :  (prevPart.position().top - 10)
                };
            break;
        }

        return bodyPartPosition;
    };

    /**
     * Update new positions
     *
     * @param data
     */
    this.updatePositions = function(data){

        var selfNewPosition = {}

        Object.keys(data).forEach(function(key, val) {

            if( ! data[key].dead){
                // Set new direction
                if (key === mainController.client.socketSessionId) {
                    _this.direction = data[key].direction;
                    selfNewPosition = {
                        'x': data[key].posx,
                        'y': data[key].posy
                    };
                }

                // Update body parts
                for (i = 0; i < data[key].segments; i++) {
                    var prevPart = null;

                    var elementNumber = (data[key].segments - i) - 1;

                    if (elementNumber === 0) {
                        prevPart = $('.head_' + key);
                    } else {
                        prevPart = $('#bodyPart_' + key + '_' + (elementNumber - 1));
                    }

                    $('#bodyPart_' + key + '_' + elementNumber).css({
                        top: prevPart.position().top,
                        left: prevPart.position().left
                    });
                }

                // Reposition heads
                $('.head_' + key).css({top: data[key].posy, left: data[key].posx});
            }else{
                $('.tail_'+key).css('visibility', 'hidden');
                $('.head_'+key).css('visibility', 'hidden');
            }
        });

        _this.detectPlayerCollision(selfNewPosition.x, selfNewPosition.y, data);
    };

    /**
     * Detect player collision
     *
     * @param posx
     * @param posy
     */
    this.detectPlayerCollision = function(posx, posy, data){

        // Body detection
        $('.head').each(function(){
            var headPosx = $(this).position().left;
            var headPosy = $(this).position().top;
            var headId = $(this).attr('id').replace("head_","");

             $('.tail').each(function(){
                if($(this).position().left === headPosx && $(this).position().top === headPosy){

                    if(_this.deadPlayers.indexOf(headId) < 0) {
                        _this.deadPlayers.push(headId);
                        _this.setPlayerDead(headId)
                    }
                }
             });

             // Edge detection
             if($(this).position().left < 0 || $(this).position().left > _this.container.width() ||
                 $(this).position().top < 0 || $(this).position().top > _this.container.height()){
                     if(_this.deadPlayers.indexOf(headId) < 0) {
                         _this.deadPlayers.push(headId);
                         _this.setPlayerDead(headId)
                     }
             }
        });

        // Food detection
        var headPosition = {
            'x': $('.head_'+mainController.client.socketSessionId).position().left,
            'y': $('.head_'+mainController.client.socketSessionId).position().top
        };

        var foodPosition = {
            'x' :  this.foodElem.position().left,
            'y' :  this.foodElem.position().top
        };


        if(headPosition.x === foodPosition.x && headPosition.y === foodPosition.y){
            mainController.playerCollectedFood();
        }
    };

    /**
     * Set a player dead
     *
     * @param key
     */
    this.setPlayerDead = function(key){
        console.log("Player " + key + " id dead");
        /*$('#head_'+key).css('visibility', 'hidden');
        $('.tail_'+key).css('visibility', 'hidden');*/
        mainController.setPlayerDead(key);
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
        this.head = this.head = $('.head');

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
     * Mobile buttons
     */
    this.startMobileKeyListeners = function(){
        // Up
        $(document).on('touchstart', '.fa-chevron-up', function(event){
            if(event.handled === false) return;
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            if(_this.direction !== 'D') mainController.updateDirectionTo('U');
        });

        // Left
        $(document).on('touchstart', '.fa-chevron-left', function(event){
            if(event.handled === false) return;
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            if(_this.direction !== 'R') mainController.updateDirectionTo('L');
        });

        // Right
        $(document).on('touchstart', '.fa-chevron-right', function(event){
            if(event.handled === false) return;
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            if(_this.direction !== 'L') mainController.updateDirectionTo('R');
        });

        // Down
        $(document).on('touchstart', '.fa-chevron-down', function(event){
            if(event.handled === false) return;
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            if(_this.direction !== 'U') mainController.updateDirectionTo('D');
        });
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
                    mainController.updateDirectionTo('L');
                break;

                case 38: case 87: // up
                if (_this.direction !== 'D')
                    mainController.updateDirectionTo('U');
                break;

                case 39: case 68: // right
                if (_this.direction !== 'L')
                    mainController.updateDirectionTo('R');
                break;

                case 40: case 83: // down
                if (_this.direction !== 'U')
                    mainController.updateDirectionTo('D');
                break;

                default:
                    return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });
    }

}