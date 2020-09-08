

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  backgroundColor: '#006400',
  dom: {
    createContainer: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

function preload() {
  this.load.html('chatform', 'chatform.html');
  this.load.image('human', 'assets/naked_human.png');
  this.load.image('bar', 'assets/BAR.png');
}

function create() {


//Text oben einblenden
 var text = this.add.text(300, 10, 'Garten Eden Alpha', { color: 'white', fontSize: '20px '});
//Greife auf DOM zu um vorgerendertes HTML Formular einzublenden
 var element = this.add.dom(150, 550).createFromCache('chatform');
//Füge ein Bild in die Map hinzu
 this.add.image(550, 550, 'bar');




 //Ladebalken
 let loadingBar = this.add.graphics({
   fillStyle: {
       color: 0xffffff //white
   }
 })

 this.load.on("buttonPlay", (percent)=>{
   console.log("percent");
 })







  // Erstelle Variable self damit Werte an Funktion übergeben werden können
  var self = this;
  // Erzeugt die Socket Connection auf der Client-Seite
  this.socket = io();

  //
  // Spawne den Spieler und andere Spieler
  //
  // Erzeuge Gruppe wo alle anderen Spieler enthalten sind, so können z.B. Kolllisionen auf alle anderen Spieler bezogen werden
  this.otherPlayers = this.physics.add.group();
  // Eventlistener hört auf currentPlayers (sobald ein neuer Spieler beitritt) und startet dann eine Funktion für den Spieler selbst in welcher das Objekt players übergeben wird
  this.socket.on('currentPlayers', function (players) {
    // Object.keys erstellt ein Array mit allen Einträgen und den dazugehörigen Werten des players Objekt
    // Anschliessend loope durch jeden id-Eintrag im Array
    Object.keys(players).forEach(function (id) {
      // Wird im Array ein id-Eintrag gefunden, welcher meiner eigenen Socket-ID entspricht, führe die Funktion addPlayers aus
      if (players[id].playerId === self.socket.id) {
        // Übergebe dann die Parameter self und das ganze betreffende player Objekt des Spielers an die externe Funktion
        addPlayer(self, players[id]);
      } else {
        // Wird ein Eintrag gefunden der nicht mit meiner Socket ID übereinstimmt, dann führe Funktion addOtherPlayers aus und übergebe Parameter self und players.id
        // Somit werden alle anderen Spieler die bereits online sind für den neuen Spieler gespawnt
        addOtherPlayers(self, players[id]);
      }
    });
  });

  // Eventlistener hört auf newPlayer (sobald ein neuer Spieler beitritt) und startet dann eine Funktion für alle Clients ausser dem Spieler selbst in welcher die player.id übergeben wird und als playerInfo behandelt wird
  this.socket.on('newPlayer', function (playerInfo) {
    // Führe Funktion addOtherPlayer aus und übergebe der externen Funktion die Parameter self und players.id
    addOtherPlayers(self, playerInfo);
  });

  // Eventlistener hört auf disconnect und führt dann eine Funktion aus in welcher die player.id übergeben wird
  this.socket.on('disconnect', function (playerId) {
    // Loope durch jeden Eintrag von OtherPlayers
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      // Entspricht die übergebene player.id einer enthaltenen ID, wird diese entfernt
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  // Erzeuge Objekt namens cursors indem die Pfeiltasten gebunden werden
  this.cursors = this.input.keyboard.createCursorKeys();

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });


}

function update() {

  //Prüfe ob Pfeiltasten gedrückt werden, falls ja ändere X oder Y Position entsprechend vom Spieler (human)
  // Mache einfache Prüfung die wahr ist, damit ich darin weitere Einstellungen tätigen kann (world.wrap)
  if(this.human) {

    // Speichere Position in Variabel auf dem Client
    var x = this.human.x;
    var y = this.human.y;
    //
    if(this.human.oldPosition && (x !== this.human.oldPosition.x || y !== this.human.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: this.human.x, y: this.human.y });
    }

    //Speichere alte Position
    this.human.oldPosition = {x: this.human.x, y: this.human.y}


  if (this.cursors.left.isDown) {
    this.human.x -= 1;
  } else if (this.cursors.up.isDown) {
    this.human.y -= 1;
  } else if (this.cursors.right.isDown) {
    this.human.x += 1;
  } else if (this.cursors.down.isDown) {
    this.human.y += 1;
  }
  this.physics.world.wrap(this.human, 5);

}




}




// Verlange für die Funktion addplayers den Parameter self und das Spielerobjekt, welches hier als playerInfo fungiert
function addPlayer(self, playerInfo) {
  // Speichere den Objektaufruf gleich in Variabel, damit human später noch weiter modifiziert werden kann.
  self.human = self.physics.add.image(playerInfo.x, playerInfo.y, 'human').setOrigin(0.5, 0.5);
}

// Verlange für die Funktion addOtherPlayers den Parameter self und die players.id
function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'human');
  // Damit in der Gruppe auch die PlayerId dazugehört zum Eintrag hier die Bindung
  otherPlayer.playerId = playerInfo.playerId;
  // Speichere andere Spieler in der Gruppe otherPlayers
  self.otherPlayers.add(otherPlayer);
}
