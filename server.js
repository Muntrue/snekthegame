var express = require('express'),
	http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

var connectedRoomUsers = {};

var dev = new Dev(true);

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

    /**
	 * Init server connection
     */
    this.init = function(){

        // Send socket session id to client
        io.to(socket.id).emit("setSocketSessionId", socket.id);

        var preScreen = new PreScreenController(this);
        preScreen.init();
        preScreen.startPreGameLoop();
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
        delete _this.roomObj[socket.id];
        dev.log(_this.playerName + ' disconnected from room ' + _this.room)
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

	this.preGameLoop = null;
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
            connectedRoomUsers[parentController.room] = {};
        }

        parentController.roomObj = connectedRoomUsers[parentController.room];
    };

    /**
     * Add the player to the global room object
     */
    this.addPlayerToRoom = function(){
        parentController.roomObj[parentController.socket.id] = {
            id: parentController.socket.id,
            owner: parentController.checkIfRoomOwner(),
            ready: false,
            name: parentController.playerName,
            color: parentController.playerColor
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

    this.sendPreGameDataToClient = function()
	{
        io.to(parentController.room).emit("setPreGameData", parentController.roomObj);
	};

	this.stopPreGameLoop = function(){
		clearInterval(this.preGameLoop);
		this.preGameLoop = null;

		dev.log("interval stop");
	}
}

/**
 * Dev tools
 *
 * @param devmode {boolean}
 * @constructor
 */
function Dev(devmode){

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
