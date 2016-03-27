var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
   //http://opengameart.org/content/bevouliin-free-game-obstacle-spikes
   game.load.bitmapFont('desyrel', '/assets/fonts/desyrel.png', '/assets/fonts/desyrel.xml');
   game.load.image('diamond','assets/diamond.png');
    game.load.image('spike','assets/spike D.png');
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);

}

// Game
var player;
var platforms;
var cursors;
var doubleJump;
var playerStartX;
var playerStartY;

// interactable
var hazards;
var stars;
// var buttons;

// Timer
// code from http://www.html5gamedevs.com/topic/1870-in-game-timer/
var timer;
var minutes = 0;
var seconds = 0;
var milliseconds = 0;

// Multiplayer
//var http = require('http');
var socket;
var players;

function create() {
    socket = io.connect();
    doubleJump = 1;
    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);
 //   game.world.setBounds(0,0,1000,1000);
    //  A simple background for our game
    game.add.sprite(0, 0, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    // Here we create the ground.
    var ground = platforms.create(0, game.world.height - 64, 'ground');

    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 2);

    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    //  Now let's create two ledges
    var ledge = platforms.create(400, 400, 'ground');
    ledge.body.immovable = true;

    ledge = platforms.create(-150, 250, 'ground');
    ledge.body.immovable = true;

    // The player and its 
    playerStartX = 32;
    playerStartY = game.world.height - 150;
    player = game.add.sprite(playerStartX, playerStartY, 'dude');

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    //    player.body.bounce.y = 0.2;
    player.body.gravity.y = 600;
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    
    // Focus camera on player
    game.camera.focusOnXY(0,0);

    // Create array of other players
    players = [];

    // Add a Hazard
    hazards = game.add.group();
    hazards.enableBody=true;
    for(var i=0;i<5;i++){
        
        var hazard = hazards.create(40+i*10,218, 'spike');
        hazard.scale.setTo(.1,.1);
        hazard.body.immovable = true;
    }
    hazards.create(550,300,'diamond');
    //  Finally some stars to collect
    stars = game.add.group();

    //  We will enable physics for any star that is created in this group
    stars.enableBody = true;

    //  Here we'll create 12 of them evenly spaced apart
    for (var i = 0; i < 2; i++)
    {
        //  Create a star inside of the 'stars' group
        var star = stars.create(200 + i * 100, 0, 'star');

        //  Let gravity do its thing
        star.body.gravity.y = 300;

        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }

   // timer = game.add.bitmapText(250, 250, 'desyrel', '00:00:00', 20);
    //  Our controls.
    game.camera.follow(player);
    cursors = game.input.keyboard.createCursorKeys();
    setEventHandlers();
}











// socket io stuff
var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected);

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect);

  // New player message received
  socket.on('new player', onNewPlayer);

  // Player move message received
  socket.on('move player', onMovePlayer);

  // Player removed message received
  socket.on('remove player', onRemovePlayer);
}

// Socket connected for first time
function onSocketConnected () {
  console.log('Connected to socket server');

  // Reset players on reconnect
  players.forEach(function (enemy) {
    enemy.player.kill();
  })
  players = [];

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y });
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server');
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id);

  // Avoid possible duplicate players
  var duplicate = playerById(data.id);
  if (duplicate) {
    console.log('Duplicate player!');
    return;
  }

  // Add new player to the remote players array
  players.push(new RemotePlayer(data.id, game, player, playerStartX, playerStartY));
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id);

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id);
    return;
  }

  // Update player position?
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  removePlayer.player.kill()

  // Remove player from array
  players.splice(players.indexOf(removePlayer), 1)
}























function update() {
    //updateTimer();
    //for(var i =0; i< players.length; i++){
    //  Collide the player and the stars with the platforms
        game.physics.arcade.collide(player, platforms);
        game.physics.arcade.collide(stars, platforms);
        game.physics.arcade.collide(hazards, stars);    
      // players[i].update();
    //}
    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    game.physics.arcade.overlap(player, stars, collectStar, null, this);
    game.physics.arcade.overlap(player,hazards, resetPlayer, null, this);
    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else
    {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }
    
    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }
    if ( player.body.touching.down && doubleJump === 0){
        doubleJump++;
    }
    // allow the player to double jump;
    if (cursors.up.isDown && doubleJump > 0 && player.body.velocity.y >= - 200){
        player.body.velocity.y = -350;
        doubleJump-=1;
    }
    socket.emit('move player',{ x: player.x, y: player.y });
}

function collectStar (player, star) {
    
    // Removes the star from the screen
    star.kill();
    // Only updates player's motion for an instant. need to modify it
    // for x seconds
    player.body.velocity.x *= 3;

}

function resetPlayer (player, hazard){
    player.kill();
    player.reset(32, game.world.height - 150);

}
function updateTimer() {
    minutes = Math.floor(game.time.time / 60000) % 60;
    seconds = Math.floor(game.time.time / 1000) % 60;
    milliseconds = Math.floor(game.time.time) % 100;
    //If any of the digits becomes a single digit number, pad it with a zero
    if (milliseconds < 10)
            milliseconds = '0' + milliseconds;
    if (seconds < 10)
            seconds = '0' + seconds;
    if (minutes < 10)
            minutes = '0' + minutes;
    timer.setText(minutes + ':'+ seconds + ':' + milliseconds);
}
// Find player by ID
function playerById (id) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].player.name === id) {
      return players[i]
    }
  }

  return false
}