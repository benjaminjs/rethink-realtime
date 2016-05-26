'use strict';

const express = require('express');
const r = require('rethinkdb');
const Events = require('events');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const emitter = new Events();

app.use(express.static('public'));

r.connect({
  db: 'chat'
}).then(function(conn){
    // DATABASE HAS CONNECTED
  const MessagesTable = r.table('messages');

  MessagesTable.changes().run(conn, function(err, messages){
    if (err) console.log(err);
    messages.each(function(err, message){
      if (err) console.log(err);
      emitter.emit('messages', message.new_val);
    });
  });

  emitter.on('new-message', function(message){
      // new-message Event triggers insert
    MessagesTable.insert(message).run(conn);
  });
});

const botMessage = function(message){ // Send message as Bot name
  emitter.emit('new-message', {
    name: 'Bot',
    message: message,
    createdAt: r.now()
  });
};

io.on('connection', function (socket) {
  let name;

  const messageHandler = function(message){
    socket.emit('messages', message);
  };

  emitter.on('messages', messageHandler);

  socket.on('disconnect', function(){
    emitter.removeListener('messages', messageHandler); // Remove listener to prevent memory leak
    botMessage(`${name} has left the building.`);
  });

  socket.on('set-name', function(nameVal){
    if (!name && nameVal && nameVal !== 'Bot') { // Only can set your name once and not to bot
      name = nameVal.toString().substr(0, 50); // Limit name length

      botMessage(`Welcome to the chatroom, ${name}.`);
    }
  });

  socket.on('new-message', function(message){
    if (!name) return; // Can't send without a name.

    const limitedMessage = message.toString().substr(0, 200); // Limit message length

    emitter.emit('new-message', {
      name: name,
      message: limitedMessage,
      createdAt: r.now()
    });
  });

});

console.log('It\'s alive!!! http://localhost:5000/ ');

server.listen(5000);
