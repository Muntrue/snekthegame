var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

var connectedRoomUsers = {};
var roomProperties = {};

var dev = new Dev(true);
dev.playerReady = true;

io.on('connection', function(socket){
	new SocketConnection(socket);
});

/**
 * On client connect
 *
 * @param socket
 * @constructor
 */
function SocketConnection(socket){

	var _this = this;

	// Set the socket
	this.socket = socket;

    // Get room variable
    this.room = socket.handshake.query.room;

    // Get name variable
    this.playerName = socket.handshake.query.name;

    // Get color variable
    this.playerColor = socket.handshake.query.color;

    // Owner of the room
    this.owner = false;

    // Room object from global object
    this.roomObj = null;

    // Room properties
    this.roomProperties = null;

    this.socketTimeout = null;

    // Snek play field dimensions
    this.containerDimensions = null;

    // Prescreen class
    this.preScreen = null;

    // Snekcontroller
    this.snekController = null;

    this.roomRunning = false;

    /**
	 * Init server connection
     */
    this.init = function(){

        // Send socket session id to client
        io.to(socket.id).emit("setSocketSessionId", socket.id);

        this.snekController = new SnekController(this);

        this.preScreen = new PreScreenController(this);
        this.preScreen.init();
        this.preScreen.startPreGameLoop();
        this.roomRunning = true;
	};

    /**
	 * Check if the player is the owner of the room
	 *
     * @returns {boolean}
     */
    this.checkIfRoomOwner = function(){
    	return Object.keys(this.roomObj).length === 0;
	};

    /**
     * Set player ready
     */
    socket.on('setPlayerReady', function(){
        _this.roomObj[socket.id].ready = true;
    });

    /**
     * Disconnect socket
     */
    socket.on('disconnect', function(){
        _this.disconnectClient();
    });

    /**
     * Update player direction
     */
    socket.on('setPlayerDirection', function(direction){
        _this.roomObj[socket.id].direction = direction;
    });

    /**
     * Disconnect the client
     */
    this.disconnectClient = function(){
        delete _this.roomObj[socket.id];
        dev.log(_this.playerName + ' disconnected from room ' + _this.room);
        clearInterval(this.preScreen.preGameLoop);
        _this.cleanUpRoom();
    };

    socket.on("setContainerDimensions" , function(dimensions){
       _this.roomProperties.containerDimensions = {
           width: parseInt(dimensions.width),
           height: parseInt(dimensions.height)
       };
    });

    socket.on("setPlayerDead", function(key){
        _this.roomObj[key].dead = true;
    });

    /**
     * Remove the room if empty
     */
    this.cleanUpRoom = function(){
        if(Object.keys(_this.roomObj).length === 0){
            dev.log('Deleting room');
            this.snekController.stopGameLoop();
            this.roomRunning = false;
            delete connectedRoomUsers[_this.room];
            delete roomProperties[_this.room];
        }
    };

    socket.on('startGame', function(){
        _this.preScreen.stopPreGameLoop();
        _this.snekController.init();
    });

    this.init();
}

/**
 * Pre screen controller
 *
 * @constructor
 */
function PreScreenController(parentController){

	var _this = this;

	// Pre game interval loop
	this.preGameLoop = null;

	// Tick rate to send to the serer
	this.tickRate = 500;

    /**
	 * Init PreScreenController
     */
	this.init = function(){
		dev.log(parentController.playerName + ' has joined room ' + parentController.room);

        // Join room
        parentController.socket.join(parentController.room);

        this.setupGlobalRoom();

        this.addPlayerToRoom();

        this.sendPreGameDataToClient();
	};

    /**
     * Set up the room in global object
     */
    this.setupGlobalRoom = function(){
        if( ! connectedRoomUsers[parentController.room]){
            dev.log('Room is new, creating...');
            parentController.snekController.stopGameLoop();
            roomProperties[parentController.room] = {};
            connectedRoomUsers[parentController.room] = {};
        }

        parentController.roomProperties = roomProperties[parentController.room];
        parentController.roomObj = connectedRoomUsers[parentController.room];
    };

    /**
     * Add the player to the global room object
     */
    this.addPlayerToRoom = function(){
        parentController.roomObj[parentController.socket.id] = {
            id: parentController.socket.id,
            owner: parentController.checkIfRoomOwner(),
            ready: dev.playerReady,
            name: parentController.playerName,
            color: parentController.playerColor,
            posx: null,
            posy: null,
            direction: null,
            segments: 3,
            dead: false
        };
    };

    /**
	 * Start the pre-game loop
     */
    this.startPreGameLoop = function(){
        // Tick rate for player start info
        this.preGameLoop = setInterval(function(){
			_this.sendPreGameDataToClient();
        }, this.tickRate);
	};

    /**
	 * Send pregame data to the client
     */
    this.sendPreGameDataToClient = function()
	{
        io.to(parentController.room).emit("setPreGameData", parentController.roomObj);
	};

    /**
	 * Stop the pre game loop
     */
	this.stopPreGameLoop = function(){
		clearInterval(this.preGameLoop);

		dev.log("interval stop");
	}
}

/**
 * SnekController
 *
 * @param parentController
 * @constructor
 */
function SnekController(parentController){

    var _this = this;

    this.gameLoop = null;

    this.gameRunning = false;

    /**
     * SnekControlelr init
     */
    this.init = function(){
        this.startCountDown();
        this.gameRunning = true;
    };

    /**
     * Start the countdown to start the game
     */
    this.startCountDown = function(){
        var countDown = 0;

        setInterval(function(){
            io.to(parentController.room).emit("getGameStartCountdown", countDown);
            countDown--;

            if(countDown < 0){
                _this.setupGame();
               clearInterval(this);
            }

        }, 1000);
    };

    /**
     * Set up game
     */
    this.setupGame = function(){
        var playerCount = Object.keys(parentController.roomObj).length;

        dev.log('Start game');
        io.to(parentController.room).emit("gameStart");

        this.setUpPlayerStartPositions(playerCount);

        this.setNewFood();

        this.updatePlayerMovement();
    };

    this.setNewFood = function(){
        var position = this.newFoodPosition();
        io.to(parentController.room).emit("setNewFood", position);
    };

    /**
     * Set up start positions
     *
     * @param playerCount
     */
    this.setUpPlayerStartPositions = function(playerCount){

        var playerPositions = [];

        var p1Pos = {
            'x' : 50,
            'y' : (parentController.roomProperties.containerDimensions.height / 2) - 5,
            'direction' : 'R'
        };

        var p2Pos = {
            'x' : (parentController.roomProperties.containerDimensions.width - 50),
            'y' : (parentController.roomProperties.containerDimensions.height / 2) - 5,
            'direction' : 'L'
        };

        var p3Pos = {
            'x' : (parentController.roomProperties.containerDimensions.width / 2) - 5,
            'y' : 50,
            'direction' : 'D'
        };

        var p4Pos = {
            'x' : (parentController.roomProperties.containerDimensions.width / 2) - 5,
            'y' : (parentController.roomProperties.containerDimensions.height - 50),
            'direction' : 'U'
        };

        switch(playerCount){
            case 2:
                playerPositions = [p1Pos, p2Pos];
            break;

            case 3:
                playerPositions = [p1Pos, p2Pos, p3Pos];
            break;

            case 4:
                playerPositions = [p1Pos, p2Pos, p3Pos, p4Pos];
            break;

        }

        var loopCounter = 0;
        Object.keys(parentController.roomObj).forEach(function(key, val) {
            parentController.roomObj[key].posx = playerPositions[loopCounter].x;
            parentController.roomObj[key].posy = playerPositions[loopCounter].y;
            parentController.roomObj[key].direction = playerPositions[loopCounter].direction;

            loopCounter++;
        });

        io.to(parentController.room).emit("setupStartPositions", parentController.roomObj);
    };


    this.updatePlayerMovement = function(){
        if(_this.gameRunning && Object.keys(parentController.roomObj).length > 0) {
            console.log("Update");
            _this.recalculatePlayerPositions();

            io.to(parentController.room).emit("setNewPositions", parentController.roomObj);

            this.gameLoop = setTimeout(_this.updatePlayerMovement, 100);
        }
    };

    this.recalculatePlayerPositions = function(){
        Object.keys(parentController.roomObj).forEach(function(key, val) {

            var currentPlayerPosition = {
                'top' : parentController.roomObj[key].posy,
                'left' : parentController.roomObj[key].posx
            };

            var newPositions = {};

            switch(parentController.roomObj[key].direction){
                case 'R':
                    newPositions = {
                        top: currentPlayerPosition.top,
                        left: currentPlayerPosition.left + 10
                    };
                break;

                case 'L':
                    newPositions = {
                        top: currentPlayerPosition.top,
                        left: currentPlayerPosition.left - 10
                    };
                break;

                case 'U':
                    newPositions = {
                        top: currentPlayerPosition.top - 10,
                        left: currentPlayerPosition.left
                    };
                break;

                case 'D':
                    newPositions = {
                        top: currentPlayerPosition.top + 10,
                        left: currentPlayerPosition.left
                    };
                break;
            }

            parentController.roomObj[key].posx = newPositions.left;
            parentController.roomObj[key].posy = newPositions.top;
        });
    };

    this.stopGameLoop = function(){
        this.gameRunning = false;
        clearTimeout(_this.gameLoop);
        clearTimeout(this.gameLoop);
    };

    /**
     * Generate a new food position
     *
     * @returns {{x: *, y: *}}
     */
    this.newFoodPosition = function(){
       return {
           'x' : this.getNumberBetween(0,parentController.roomProperties.containerDimensions.width - 10),
           'y' : this.getNumberBetween(0,parentController.roomProperties.containerDimensions.height - 10)
       }
    };

    /**
     * Get number between min and max
     *
     * @param min
     * @param max
     * @return {*}
     */
    this.getNumberBetween = function(min, max) {
        newNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        if (newNumber % 10 === 0) {
            return newNumber;
        }
        else {
            return this.getNumberBetween(min, max)
        }
    }

}

/**
 * Dev tools
 *
 * @param devmode {boolean}
 * @constructor
 */
function Dev(devmode){

    this.playerReady = null;
	this.devmode = devmode;

    /**
	 * Log data
	 *
     * @param string
     */
	this.log = function(string){
		if(this.devmode){
			console.log(string)
		}
	}
}
