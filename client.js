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
			console.log(msg);
		});

		this.socket.on('setSocketData', function(data){
			console.log(data);
			Object.keys(data).forEach(function(key, val) {

				console.log(val);

			});
		});
	};


	this.boot();
}