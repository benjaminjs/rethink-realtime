'use strict';
/* global io */

var socket = io('http://localhost:5000/');
var messageFormEl = document.getElementById('messageForm');

var getName = function(){
  return prompt('Enter your name:', '');
};

var stringToColor = function(str) {
  var hash = 0;

  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 3) - hash);
  }
  var color = Math.abs(hash).toString(16).substring(0, 6);

  return '#' + '000000'.substring(0, 6 - color.length) + color;
};

var addMessage = function(name, message){ // Append Message to chat list
  var $$$ = document.createElement.bind(document);
  var chatEl = document.getElementById('chat');

  var newNameEl = $$$('div');

  newNameEl.className = 'col-md-3 text-md-right';

  var boldNameEl = $$$('b');

  boldNameEl.textContent = name;
  boldNameEl.style.color = stringToColor(name);
  newNameEl.appendChild(boldNameEl);

  var newMessageEl = $$$('div');

  newMessageEl.className = 'col-md-9';
  newMessageEl.textContent = message;

  chatEl.appendChild(newNameEl);
  chatEl.appendChild(newMessageEl);
};

var sendMessage = function(event){ // Event handler for submit of the message input form
  event.preventDefault();

  var messageEl = document.getElementById('message');

  if (messageEl.value){
    socket.emit('new-message', messageEl.value);
    messageEl.value = '';
  }
};

messageFormEl.onsubmit = sendMessage;

socket.on('messages', function(newMessage){
  addMessage(newMessage.name, newMessage.message);
});

let name;

socket.on('connect', function(){ // On connect set name and
  while (!name){ // Wait till you give me a real name. #GhettoCode4Life
    name = getName();
  }

  socket.emit('set-name', name);
});
