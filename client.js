function Client(room)
{
	var _this = this;

	this.server = 'http://localhost:3000';
	this.socket = null;
	this.room = room;
	this.socketSessionId = null;

	this.boot = function(){

		this.socket = io(this.server + '?room=' + this.room);

		this.socket.on('userCountResponse', function(msg){
			userCountResponse(msg);
		});

		this.socket.on('setSocketSessionId', function(msg){
			_this.socketSessionId = msg;
		});

		this.socket.on('setPreGameData', function(data){
			preGamePlayerReady(data);
		});
	};

	/**
	 * Set player ready
	 */
	this.setPlayerReady = function(){
		this.socket.emit('setPlayerReady');
	};


	this.boot();
}