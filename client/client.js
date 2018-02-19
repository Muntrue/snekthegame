function Client(room, playerName, color, mainController)
{
	var _this = this;

	this.server = 'http://localhost:3000';
	this.socket = null;
	this.room = room;
	this.playerName = playerName;
	this.socketSessionId = null;
	this.color = color;

	this.boot = function(){

		this.socket = io(this.server + '?room=' + this.room + '&name=' + this.playerName + '&color=' + this.color);

		var containerDimensions = {
			width: $('.snekContainer').width(),
			height: $('.snekContainer').height()
		};

        this.socket.emit('setContainerDimensions', containerDimensions);

		this.socket.on('userCountResponse', function(msg){
			mainController.userCountResponse(msg);
		});

		this.socket.on('setSocketSessionId', function(msg){
			_this.socketSessionId = msg;
		});

		this.socket.on('setPreGameData', function(data){
            mainController.preGamePlayerReady(data);
		});

        this.socket.on('getGameStartCountdown', function(data){
            mainController.updateCountdown(data);
        });

        this.socket.on('gameStart', function(){
            mainController.initializeGame();
        });

        this.socket.on('setupStartPositions', function(data){
            mainController.setupStartPositions(data);
		});

        this.socket.on('setNewPositions', function(data){
        	mainController.updatePositions(data);
		});

        this.socket.on('setNewFood', function(position){
            mainController.getNewFood(position);
        });

        this.socket.on('spawnNewSegmentForPlayer', function(key, data){
            mainController.spawnNewSegmentForPlayer(key, data);
        });

	};

	this.playerCollectedFood = function(){
        this.socket.emit('playerCollectedFood');
	};

	this.startGame = function(){
        this.socket.emit('startGame');
	};

	/**
	 * Set player ready
	 */
	this.setPlayerReady = function(){
		this.socket.emit('setPlayerReady');
	};

    /**
	 * Send update event to server
	 *
     * @param direction {string}
     */
	this.updateDirectionTo = function(direction){
        this.socket.emit('setPlayerDirection', direction);
	};

	this.setPlayerDead = function(key){
        this.socket.emit('setPlayerDead', key);
	};

	this.boot();
}