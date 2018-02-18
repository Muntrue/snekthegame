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

    /**
	 * Init server connection
     */
    this.init = function(){

        // Send socket session id to client
        io.to(socket.id).emit("setSocketSessionId", socket.id);

        this.preScreen = new PreScreenController(this);
        this.preScreen.init();
        this.preScreen.startPreGameLoop();
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

    /**
     * Remove the room if empty
     */
    this.cleanUpRoom = function(){
        dev.log(connectedRoomUsers);
        if(Object.keys(_this.roomObj).length === 0){
            dev.log('Deleting room');
            delete connectedRoomUsers[_this.room];
            delete roomProperties[_this.room];
        }
    };

    socket.on('startGame', function(){
        _this.preScreen.stopPreGameLoop()
        _this.snekController = new SnekController(_this);
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
            segments: 2
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

    /**
     * SnekControlelr init
     */
    this.init = function(){
        this.startCountDown();
    };

    /**
     * Start the countdown to start the game
     */
    this.startCountDown = function(){
        var countDown = 1;

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
    };

    /**
     * Set up start positions
     *
     * @param playerCount
     */
    this.setUpPlayerStartPositions = function(playerCount){

        var playerPositions = [];

        var twoPlayerPositions = [
            {
                'x' : 50,
                'y' : (parentController.roomProperties.containerDimensions.height / 2),
                'direction' : 'R'
            },
            {
                'x' : (parentController.roomProperties.containerDimensions.width - 50),
                'y' : (parentController.roomProperties.containerDimensions.height / 2),
                'direction' : 'L'
            }
        ];

        switch(playerCount){
            case 2:{
                playerPositions = twoPlayerPositions;
                break;
            }
        }

        var loopCounter = 0;
        Object.keys(parentController.roomObj).forEach(function(key, val) {
            parentController.roomObj[key].posx = playerPositions[loopCounter].x;
            parentController.roomObj[key].posy = playerPositions[loopCounter].y;
            parentController.roomObj[key].direction = playerPositions[loopCounter].direction;
        });

        io.to(parentController.room).emit("setupStartPositions", parentController.roomObj);
    };

    this.init();
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
