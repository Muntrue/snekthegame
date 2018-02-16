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

	// Send socket session id to client
	io.to(socket.id).emit("setSocketSessionId", socket.id);

	// Join roo,
	socket.join(room);

	// If room not exist, create the object
	if( ! connectedRoomUsers[room]){
		connectedRoomUsers[room] = {};
	}

	// Add player to room count
	connectedRoomUsers[room][socket.id] = {
		ready: false
	};

	/**
	 * Disconnect socket
	 */
	socket.on('disconnect', function(){
		delete connectedRoomUsers[room][socket.id];
		console.log('user disconnected from room ' + room);
	});

	// Tick rate for player info
	setInterval(function(){
		io.to(room).emit("setSocketData", connectedRoomUsers[room]);
	}, 500);
});

