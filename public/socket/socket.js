var socket = io.connect();
var destination;
socket.on('destination', function(msg){
    destination = msg;
});
socket.on('departure', function(msg){
    var string = '<th>*</th><th>' + msg.value + '</th><th>' + destination.value + '</th>'
});