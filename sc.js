var segments = 2;
var direction = "R";
var speed = 8;
var $container = null;
var $head = null;
var $food = null;

/**
 * Keydown event listner
 */
$(document).keydown(function (e) {
	switch (e.which) {
		case 37: case 65: // left
			if (direction !== 'R')
				direction = "L";
			break;

		case 38: case 87: // up
			if (direction !== 'D')
				direction = "U";
			break;

		case 39: case 68: // right
			if (direction !== 'L')
				direction = "R";
			break;

		case 40: case 83: // down
			if (direction !== 'U')
				direction = "D";
			break;

		default:
			return; // exit this handler for other keys
	}
	e.preventDefault(); // prevent the default action (scroll / move caret)
});

/**
 * General init function
 */
function init() {
	$container = $('.snekContainer');

	$container.append('<div class="food"></div>');

	$food = $('.food');
	$food.css({top: -100, left: -100});

	$container.append('<div id="head" class="bodyPart"></div>');

	$head = $('#head');

	for (i = 0; i < segments; i++) {

		$container.append('<div id="bodyPart_' + i + '" class="bodyPart"></div>');

		if (i === 0) {
			$bodyPart = $head;
		} else {
			$bodyPart = $('#bodyPart_' + (i - 1));
		}

		$("#bodyPart_" + i).css({top: $bodyPart.position().top, left: ($bodyPart.position().left - 10)});
	}

	$container.append("<span class='score'>0</span>");
	$score = $('.score');

	$container.append("<div id='light'>&#128161;</div>");
	$light = $('#light');

	moveParts();
	generateFood();

	if($container.hasClass('rainbow')) makeMeRainbow();

}

/**
 * Move all parts
 */
function moveParts() {
	var config = {
		direction: null,
		type: null
	};

	switch (direction) {
		case 'L':
			config.direction = 'X';
			config.type = 0;
			break;

		case 'R':
			config.direction = 'X';
			config.type = 1;
			break;

		case 'U':
			config.direction = 'Y';
			config.type = 0;
			break;

		case 'D':
			config.direction = 'Y';
			config.type = 1;
			break;

		default:
			return; // exit this handler for other keys
	}

	var oldX = null;
	var oldY = null;

	$('.bodyPart').each(function (i) {
		i = i - 1;

		var newX = null;
		var newY = null;

		var tmpX = $(this).position().left;
		var tmpY = $(this).position().top;

		if (i < 0) {
			newX = $(this).position().left;
			newY = $(this).position().top;

			if (config.direction === "X") {
				if (config.type) newX += 10;
				else newX -= 10;
			} else {
				if (config.type) newY += 10;
				else newY -= 10;
			}

		} else if (i === 0) {
			newX = oldX;
			newY = oldY;
		} else {
			newX = oldX;
			newY = oldY;
		}

		$(this).css({top: newY, left: newX});

		oldX = tmpX;
		oldY = tmpY;

	});

	$('.bodyPart').show();
	edgeDetection();

}

/**
 * Detect if snake hits edges
 */
function edgeDetection() {
	var X = parseInt($head.position().left);
	var Y = parseInt($head.position().top);
	var dead = null;

	if (X < 0 ||
		X > $container.width() ||
		Y < 0 ||
		Y > $container.height()) {
		dead = 1;
	}


	$('.bodyPart').each(function () {
		if ($(this).attr('id') !== 'head') {
			if (X === $(this).position().left && Y === $(this).position().top) {
				dead = 1;
				return;
			}
		}
	});

	if (!dead) {
		foodDetection();
	} else {
		$score.html("GAME OVER || " + (segments - 2) * 10 + " || GAME OVER");
		makeMeRainbow();
	}
}

/**
 * Detect if snake hits food
 */
function foodDetection() {
	var headX = parseInt($head.position().left);
	var headY = parseInt($head.position().top);
	var foodX = parseInt($food.position().left);
	var foodY = parseInt($food.position().top);

	if (headX === foodX && headY === foodY) {
		collectedFood();
	}

	setTimeout(function () {
		moveParts();
	}, (10 * speed));
}

/**
 * Generate a new food
 */
function generateFood() {
	var foodX = getNumberBetween(0, $container.width() - 10);
	var foodY = getNumberBetween(0, $container.height() - 10);

	$food.css({top: foodY, left: foodX});

}

/**
 * Snake collected food
 */
function collectedFood() {
	$container.append('<div id="bodyPart_' + segments + '" class="bodyPart" style="display:none;"></div>');
	segments++;

	var score = (segments - 2) * 10;
	$score.html(score);

	if (score % 50 === 0) {
		if (speed > 1) speed--;
	}

	generateFood();
}

$(document).ready(function () {
	init();

	$light.click(function () {
		console.log($container.hasClass('light'));
		if ($container.hasClass('light')) {
			$container.removeClass('light');
			$container.addClass('dark');
		} else {
			$container.removeClass('dark');
			$container.addClass('light');
		}
	});
});

/**
 * Get number between min and max
 *
 * @param min
 * @param max
 * @return {*}
 */
function getNumberBetween(min, max) {
	newNumber = Math.floor(Math.random() * (max - min + 1)) + min;

	if (newNumber % 10 === 0) {
		return newNumber;
	}
	else {
		return getNumberBetween(min, max)
	}
}

function makeMeRainbow(){

	// Food
	var newColor = '#'+Math.floor(Math.random()*16777215).toString(16);
	$food.css('background-color', newColor);

	// Body
	$('.bodyPart').each(function(){
		var newColor = '#'+Math.floor(Math.random()*16777215).toString(16);
		$(this).css('background-color', newColor);
	});

	newColor = '#'+Math.floor(Math.random()*16777215).toString(16);
	$container.css('background-color', newColor);

	newColor = '#'+Math.floor(Math.random()*16777215).toString(16);
	$score.css('background-color', newColor);

	newColor = '#'+Math.floor(Math.random()*16777215).toString(16);
	$score.css('color', newColor);


	setTimeout(function(){
		makeMeRainbow();
	},250);
}