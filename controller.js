var roomId = null;
var client = null;

var socketWaitLoop = null;

$(document).ready(function(){

	$('[data-toggle="tooltip"]').tooltip()

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
	})


});

function connectToRoom(){
	roomId = $('.txt-room-id').val();
	client = new Client(roomId);

	$('.roomContainer').html('<h2>You are connected to room<br /><span class="badge badge-secondary">'+ roomId +'</span></h2>').css('text-align', 'center');
}


function generateRandomId() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

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

		if(data[key].id === client.socketSessionId){
			me = "pregameMe";
		}

		if(data[key].ready)
		{
			readyPlayers.push(client.socketSessionId);

			newLi = '<li class="list-group-item ' + me + '">Player ' + playerNum + ' <span class="badge badge-success float-right">Ready</span></li>';
		}else{
			newLi = '<li class="list-group-item ' + me + '">Player ' + playerNum + ' <span class="badge badge-danger float-right">Not ready</span></li>';
		}

		$('.plyr-count ul').append(newLi);

		playerNum++;
	});

	if(readyPlayers.length === Object.keys(data).length && Object.keys(data).length > 1)
	{
		$('.btn-start').attr('data-original-title', 'Start the game!').removeClass('disabled');
	}
}

function setPlayerReady(){
	$('.btn-ready').addClass('disabled');
	client.setPlayerReady();
}