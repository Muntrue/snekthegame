var roomId = null;
var client = null;

var socketWaitLoop = null;

$(document).ready(function(){

});

function makeNewRoom(){
	roomId = generateRandomId();
	client = new Client(roomId);

	$('.roomContainer').html('<center>You are connected to room <h1>' + roomId + '</h1></center><br /><br /><span class="connectedPlayers"></span> <span class="statusText"></span>');

	socketWaitLoop = setInterval(function(){
		client.socket.emit('userCountRequest');
	},500);
}

function connectToRoom(){
	roomId = $('.roomName').val();
	client = new Client(roomId);

	$('.roomContainer').html('<center>You are connected to room <h1>' + roomId + '</h1></center><br /><br /><span class="connectedPlayers"></span> <span class="statusText"></span>');

}

function userCountResponse(response){
	var connected = parseInt(response);

	if(response < 2)
	{
		$('.connectedPlayers').html(response + " player connected...");
		$('.statusText').html('Waiting for more players');
	}else{
		$('.connectedPlayers').html(response + " player connected...");
		$('.statusText').html('');
	}
}

function generateRandomId() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}