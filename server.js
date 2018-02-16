var express = require('express'),
	http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

var connectedRoomUsers = {};

io.on('connection', function(socket){

	// Get room variable
	var room = socket.handshake.query.room;

    // Get name variable
    var playerName = socket.handshake.query.name;

    // Get color variable
    var playerColor = socket.handshake.query.color;

	var preGameLoop = null;

	// Send socket session id to client
	io.to(socket.id).emit("setSocketSessionId", socket.id);

	// Join roo,
	socket.join(room);

	// If room not exist, create the object
	if( ! connectedRoomUsers[room]){
		connectedRoomUsers[room] = {};
	}

	var owner = false;
	if(Object.keys(connectedRoomUsers[room]).length === 0) owner = true;

	// Add player to room count
	connectedRoomUsers[room][socket.id] = {
		id: socket.id,
		owner: owner,
		ready: false,
		name: playerName,
		color: playerColor
	};

	/**
	 * Set player ready
	 */
	socket.on('setPlayerReady', function(){
		connectedRoomUsers[room][socket.id].ready = true;
	});

	/**
	 * Disconnect socket
	 */
	socket.on('disconnect', function(){
		delete connectedRoomUsers[room][socket.id];
		console.log('user disconnected from room ' + room);
	});

	// Tick rate for player start info
	preGameLoop = setInterval(function(){
		io.to(room).emit("setPreGameData", connectedRoomUsers[room]);
	}, 500);
});

