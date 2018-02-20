var mainController = null;

/**
 * On document ready
 */
$(document).ready(function(){

	//snekController.start();
	mainController = new MainController();

    $('.cp10').colorpicker({
        useHashPrefix: false,
		input: false
    }).on('colorpickerCreate', function(e){
        e.colorpicker.setValue('#'+mainController.generateRandomColor())
	}).on('colorpickerChange', function (e) {
        mainController.playerColor = e.color.toHex();
    });

	$('[data-toggle="tooltip"]').tooltip();

	var randomId = mainController.generateRandomId();

	if(window.location.hash) {
		$('.txt-room-id').val(window.location.hash.replace('#',''));
	} else {
		$('.txt-room-id').val(randomId);
	}

	$('.txt-room-id').on('focus', function(){
		if($(this).val() === randomId){
			$(this).val('');
		}
	});

	$('.txt-room-id').on('blur', function(){
		if($(this).val() === ''){
			$(this).val(randomId);
		}
	});

	var playerName = mainController.generateRandomName();

	$('.txt-plyr-name').val(playerName);
    $('.txt-plyr-name').on('focus', function(){
        if($(this).val() === playerName){
            $(this).val('');
        }
    })

    $('.txt-plyr-name').on('blur', function(){
        if($(this).val() === ''){
            $(this).val(playerName);
        }
    });
});

function MainController(){

	var _this = this;

    this.roomId = null;
    this.client = null;
    this.snekController = null;
    this.playerColor = null;
    this.allPlayersReady = false;

    /**
     * Connect to a room
     */
    this.connectToRoom = function(){
        this.roomId = $('.txt-room-id').val();
        this.client = new Client(this.roomId, $('.txt-plyr-name').val(), this.playerColor, this);
	    parent.location.hash = this.roomId;
        $('.roomContainer').html('<h2>You are connected to room<br /><span class="badge badge-secondary">'+ this.roomId +'</span></h2>').css('text-align', 'center');
    };

    /**
     * Generate random string
     *
     * @returns {string}
     */
    this.generateRandomId = function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };

    /**
     * Generate a random color
     *
     * @returns {string}
     */
    this.generateRandomColor = function(){
        return Math.floor(Math.random()*16777215).toString(16);
    };

    /**
     * Generate a random name
     *
     * @returns {string}
     */
    this.generateRandomName = function(){
        return "Player"+(Math.floor(Math.random() * 10000) + 1000);
    };

    /**
     * Pre game player ready handler
     *
     * @param data
     */
    this.preGamePlayerReady = function(data){

        if(data[this.client.socketSessionId].owner){
            $('.btn-start').removeClass('d-none').addClass('d-inline-block');

            if(Object.keys(data).length > 1){
                $('.btn-start').attr('data-original-title', 'Not everybody is ready');
            }
        }


        $('.plyr-count').removeClass('d-none');
        $('.btn-ready').removeClass('d-none').addClass('d-inline-block');
        $('.plyr-count ul').html('');

	    $('.popOut ul').html('');

        var playerNum = 1;

        var readyPlayers = [];

        Object.keys(data).forEach(function(key, val) {
            var newLi = "";
            var me = "";
            var meEl = "";

            if(data[key].id === _this.client.socketSessionId){
                me = "pregameMe";
                meEl = '<span class="badge badge-secondary float-right mr-3">You</span></li>';
            }

            if(data[key].ready)
            {
                readyPlayers.push(_this.client.socketSessionId);

                newLi = '<li style="background-color:#' + data[key].color + ';" class="list-group-item prescreen-name ' + me + '">' + data[key].name + '<span class="badge badge-success float-right">Ready</span>'+meEl+'</li>';
            }else{
                newLi = '<li style="background-color:#' + data[key].color + ';" class="list-group-item prescreen-name ' + me + '">' + data[key].name + '<span class="badge badge-danger float-right">Not ready</span>'+ meEl +'</li>';
            }

            $('.plyr-count ul').append(newLi);
	        $('.popOut ul').append("<li id='playerPill_"+data[key].id+"'><span class=\"badge badge-secondary player-name\" style='background-color:#"+data[key].color+" !important;'>"+data[key].name+"</span> <span class=\"badge badge-dark player-score\" data-score='0'>"+data[key].score+"</span><div class=\"clearfix\"></div></li>");

            playerNum++;
        });

        if(readyPlayers.length === Object.keys(data).length && Object.keys(data).length > 1)
        {
            this.allPlayersReady = true;
            $('.btn-start').attr('data-original-title', 'Start the game!').removeClass('disabled');
        }
    };

    /**
     * Start the game
     */
    this.startGame = function(){
        if(this.allPlayersReady){
            this.client.startGame();
            $('.gameCountdown').removeClass('d-none');
        }
    };

    /**
     * Update countdown clock
     *
     * @param data
     */
    this.updateCountdown = function(data){
        $('.gameCountdown').removeClass('d-none');
        $('.gameCountdown span').html(data);
        $('.popOut').css('left', 'calc(50% + 350px)');
    };

    /**
     * Init the game
     */
    this.initializeGame = function(){
        $('.snekContainer').removeClass('d-none');
        $('.prescreen').addClass('d-none');
        this.snekController = new Snek(this);
    };

    /**
     * Set the player to ready
     */
    this.setPlayerReady = function(){
        $('.btn-ready').addClass('disabled');
        this.client.setPlayerReady();
    };

	/**
	 * Set up the start positions
	 *
	 * @param data
	 */
	this.setupStartPositions = function(data){
        this.snekController.setStartPositions(data);
    };

	/**
	 * Update player positions
	 *
	 * @param data
	 */
    this.updatePositions = function(data){

    	this.snekController.updatePositions(data);
    	this.updatePlayerPills(data);
	};

	/**
	 * Update player pills
	 *
	 * @param data
	 */
	this.updatePlayerPills = function(data){

		Object.keys(data).forEach(function(key, val)
		{
			$('#playerPill_'+data[key].id+' .player_score').html(data[key].score);
			if(data[key].dead && ! $('#playerPill_'+data[key].id+' .player-name').hasClass('strike-off')){
				$('#playerPill_'+data[key].id+' .player-name').addClass('strike-off');
			}
		});
    };

	/**
	 * Sort list
	 *
	 * @param a
	 * @param b
	 * @return {number}
	 */
	this.sortByScore = function (a, b) {
		return ($(b).data('position')) < ($(a).data('position')) ? 1 : -1;
	};

    /**
	 * Update the players direction
	 *
     * @param direction {string}
     */
    this.updateDirectionTo = function(direction){
		this.client.updateDirectionTo(direction);
	};

    /**
	 * Set a player dead
	 *
     * @param key
     */
	this.setPlayerDead = function(key){
    	this.client.setPlayerDead(key);
	};

    /**
	 * Get new food
	 *
     * @param position
     */
	this.getNewFood = function(position){
		this.snekController.getNewFood(position);
	};

	/**
	 * Player collected a food item
	 */
	this.playerCollectedFood = function(){
		this.client.playerCollectedFood();
	};

	/**
	 * Spawn a new segment for player
	 *
	 * @param key
	 * @param data
	 */
	this.spawnNewSegmentForPlayer = function(key, data){
		this.snekController.spawnNewSegmentForPlayer(key, data);
	};

	this.announceWinner = function(winnerId){
		this.client.disconnect();
		$('.snekContainer').append('<div style="width:100%;height:100%;position:absolute;left:0px;top:0px;background-color:rgba(0,0,0,0.5);color:#FFF;text-align:center;"><div style="padding:20px;text-align:center;"></div><h1>GAME OVER</h1> The winner is '+$('#playerPill_'+winnerId).find('.player-name').html()+"<br /><br /><button onclick=\"window.location.hash='#"+this.roomId+"';location.reload();\" type=\"button\" class=\"btn btn-primary\">Play Again</button></div></div>");
	}
}