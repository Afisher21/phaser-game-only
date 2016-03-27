var RemotePlayer = function(index, game, player, startX, startY) {
    // possibly accept cursors as another argument?
  this.game = game;
  this.player = player;

  // The player and its settings
    this.player = game.add.sprite(startX, startY, 'dude');
    this.player.name = index.toString();

    //  We need to enable physics on the player
    game.physics.arcade.enable(this.player);
    this.player.body.gravity.y = 600;
    this.player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    this.player.animations.add('left', [0, 1, 2, 3], 10, true);
    this.player.animations.add('right', [5, 6, 7, 8], 10, true);
    
    // Focus camera on player
    /*
    game.camera.focusOnXY(0,0);
    game.camera.follow(player);
    */
  //cursors = game.input.keyboard.createCursorKeys();
}