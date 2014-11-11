var createGame = require('voxel-engine');
var voxel = require('voxel');

var context = new AudioContext();
var sound;
var soundUrl = '/audio/jump.mp3';



function loadSound(url) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      sound = buffer;
    }, function(err) {
      throw new Error(err);
    });
  }
  request.send();
}

function playSound(buffer) {
	var source = context.createBufferSource();
	source.buffer = buffer;
	source.connect(context.destination);
	source.start(0);
}

var sound = loadSound(soundUrl);

// Load game and generate world
var game = createGame({
	texturePath: '/textures/',
    generate: function(x, y, z) {
    	return y === 1 ? 1 : 0
  	},
});


// On click event
game.on('fire', function(pos) {
	var cameraPos = game.cameraPosition();
	var cameraVector = game.cameraVector();
	var target = game.raycastVoxels(cameraPos, cameraVector, 5);
	if (target) {
		playSound(sound);
		game.setBlock(target.position, 0);
	}

});

var container = document.body;
game.appendTo(container);

// Create player model and place camera in player
var createPlayer = require('voxel-player')(game);

var dude = createPlayer('dude.png');
dude.possess();
dude.yaw.position.set(0, 50, 0);

var clouds = require('voxel-clouds')({

  // pass a copy of the game
  game: game,

  // how high up the clouds should be from the player
  high: 5,

  // the distance from the player the clouds should repeat
  distance: 200,

  // how many clouds to generate
  many: 200,

  // how fast the clouds should move
  speed: 0.1,

  // material of the clouds
  material: new game.THREE.MeshBasicMaterial({
    emissive: 0xffffff,
    shading: game.THREE.FlatShading,
    fog: true,
    transparent: true,
    opacity: 0.7,
  }),
});

function addImage(src) {
  function appendImage(el) {
    var right = document.querySelector('.right');
    if (right && right.childNodes.length > 10) {
      right.removeChild(right.childNodes[2]);
    }
    var li = document.createElement('li');
    li.appendChild(el);
    if (right) right.appendChild(li);
  }
  if (typeof src === 'string') {
    var img = new Image();
    img.onload = function() {
      appendImage(img);
    }
    img.src = src;
  } else {
    appendImage(src);
  }
}

var critterCreator = require('voxel-critter')(game);
function createCritter(img, done) {
  if (typeof img !== 'string') {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    addImage(canvas);
  } else {
    addImage(img);
  }
  critterCreator(img, function(err, critter) {
    critter.position.clone(game.controls.target().avatar.position);
    critter.position.z += 10;
    critter.position.y += 10;
    
    critter.on('block', function () {
      critter.move(0, 0.02, 0.02);
    });
    critter.notice(dude, { radius: 5 });
    
    critter.on('notice', function (p) {
      critter.lookAt(p);
      critter.move(0, 0, 0.05);
    });
    
    critter.on('collide', function (p) {
      //console.log('COLLISION');
    });

    game.setInterval(function () {
      if (critter.noticed) return;
      critter.rotation.y += Math.random() * Math.PI / 2 - Math.PI / 4;
      critter.move(0, 0, 0.05 * Math.random());
    }, 1000);

    if (typeof done === 'function') done(null, critter);
  });
}

game.once('tick', function() {
  for (var i = 0; i < 50; i++) {
    createCritter('./horsey.png', function(err, r) {
      r.position.x = 0;
      r.position.y = dude.yaw.position.y;
      r.position.z = dude.yaw.position.z - i;
    });
  }
  for (var i = 0; i < 50; i++) {
    createCritter('./lolwhut.png', function(err, r) {
      r.position.x = 0;
      r.position.y = dude.yaw.position.y;
      r.position.z = dude.yaw.position.z - i;
    });
  }
  for (var i = 0; i < 50; i++) {
    createCritter('./woofy.png', function(err, r) {
      r.position.x = 0;
      r.position.y = dude.yaw.position.y;
      r.position.z = dude.yaw.position.z - i;
    });
  }    
});

// on tick, move the clouds
game.on('tick', clouds.tick.bind(clouds));

