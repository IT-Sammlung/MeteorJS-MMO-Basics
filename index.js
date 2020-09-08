// Binde Express Modul ein
var express = require('express');
// Initialisiere Express Modul
var app = express();
// Initialisiere http Server
var http = require('http').Server(app);
// Binde Socket.IO Modul ein
var io = require('socket.io').listen(http);

// Erstelle Objekt players
var players = {};


// Übertrage die statischen Files über das Verzeichnis public
app.use(express.static(__dirname + '/public'))


// Weise index.html als Startseite zu
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Bei einer neuen Verbindung
io.on('connection', function (socket) {
  console.log('a user connected');

  // Erstellt nun einen neuen Spieler mit eindeutiger socket.id
  players[socket.id] = {
    // X-Koordinate für spawn
    x: 50,
    // Y-Koordinate für spawn
    y: 50,
    // ID = Socket.id
    playerId: socket.id
  };

  // socket.emit übermittelt an den Client (neuer Spieler) ein Event namens currentPlayers und überreicht das Objekt players
  // damit können wir dem neuen Spieler alle anderen Spieler übergeben
  socket.emit('currentPlayers', players);

  // socket.broadcast.emit übermittelt an die Clients (bestehende Spieler) ein Event namens newPlayer und überreicht die socket.id
  // damit können wir den bestehenden Spielern den neuen Spieler übergeben
  // mit broadcast wird es an jeden Client gesendet bis auf sich selbst
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Bei einer geschlossenen Verbindung
  socket.on('disconnect', function () {
    console.log('user disconnected');
    // Löscht den Spieler aus dem Objekt players
    delete players[socket.id];
    // io.emit übermittelt an die Clients (bestehende Spieler) ein Event namens disconnect und überreich die socket.id
    // damit können wir den bestehenden Spielern den Spieler welcher das Spiel verlassen hat entfernen
    io.emit('disconnect', socket.id);
  });

  // Wenn das playerMovement Event empfangen wird auf dem Server, ändern wir die X und Y Koordinaten auf dem Server des Spielers
  // Danach senden wir über socket.broadcast allen anderen Spielern die neue Position
  socket.on('playerMovement', function(movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

});

//Socket IO Serverstart
http.listen(8081, () => {
  console.log('listening on *:8081');
});
