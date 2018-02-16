var roomId = null;
var client = null;
var playerColor = null;

/**
 * On document ready
 */
$(document).ready(function(){

    $('.cp10').colorpicker({
        useHashPrefix: false,
		input: false
    }).on('colorpickerCreate', function(e){
        e.colorpicker.setValue('#'+generateRandomColor())
	}).on('colorpickerChange', function (e) {
		playerColor = e.color.toHex();
    });


	$('[data-toggle="tooltip"]').tooltip();

	var randomId = generateRandomId();

	$('.txt-room-id').val(randomId);

	$('.txt-room-id').on('focus', function(){
		if($(this).val() === randomId){
			$(this).val('');
		}
	})

	$('.txt-room-id').on('blur', function(){
		if($(this).val() === ''){
			$(this).val(randomId);
		}
	});

	var playerName = generateRandomName();

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

/**
 * Connect to a room
 */
function connectToRoom(){
	roomId = $('.txt-room-id').val();
	client = new Client(roomId, $('.txt-plyr-name').val(), playerColor);

	$('.roomContainer').html('<h2>You are connected to room<br /><span class="badge badge-secondary">'+ roomId +'</span></h2>').css('text-align', 'center');
}

/**
 * Generate random string
 *
 * @returns {string}
 */
function generateRandomId() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";

	for (var i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

/**
 * Generate a random color
 *
 * @returns {string}
 */
function generateRandomColor(){
	return Math.floor(Math.random()*16777215).toString(16);
}

/**
 * Generate a random name
 *
 * @returns {string}
 */
function generateRandomName(){
	return "Player"+(Math.floor(Math.random() * 10000) + 1000);
}

/**
 * Pre game player ready handler
 *
 * @param data
 */
function preGamePlayerReady(data){

	if(data[client.socketSessionId].owner){
		$('.btn-start').removeClass('d-none').addClass('d-inline-block');

		if(Object.keys(data).length > 1){
			$('.btn-start').attr('data-original-title', 'Not everybody is ready');
		}
	}


	$('.plyr-count').removeClass('d-none');
	$('.btn-ready').removeClass('d-none').addClass('d-inline-block');
	$('.plyr-count ul').html('');

	var playerNum = 1;

	var readyPlayers = [];

	Object.keys(data).forEach(function(key, val) {
		var newLi = "";
		var me = "";
		var meEl = "";

		if(data[key].id === client.socketSessionId){
			me = "pregameMe";
			meEl = '<span class="badge badge-secondary float-right mr-3">You</span></li>';
		}

		if(data[key].ready)
		{
			readyPlayers.push(client.socketSessionId);

			newLi = '<li style="background-color:#' + data[key].color + ';" class="list-group-item prescreen-name ' + me + '">' + data[key].name + '<span class="badge badge-success float-right">Ready</span>'+meEl+'</li>';
		}else{
			newLi = '<li style="background-color:#' + data[key].color + ';" class="list-group-item prescreen-name ' + me + '">' + data[key].name + '<span class="badge badge-danger float-right">Not ready</span>'+ meEl +'</li>';
		}

		$('.plyr-count ul').append(newLi);

		playerNum++;
	});

	if(readyPlayers.length === Object.keys(data).length && Object.keys(data).length > 1)
	{
		$('.btn-start').attr('data-original-title', 'Start the game!').removeClass('disabled');
	}
}

/**
 * Set the player to ready
 */
function setPlayerReady(){
	$('.btn-ready').addClass('disabled');
	client.setPlayerReady();
}