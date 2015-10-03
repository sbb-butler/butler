var socket = io.connect();
var destination;
socket.on('destination', function(msg){
    destination = msg.toString();
});

socket.on('departure', function(msg){
    var row = '<tr><th>*</th><th>' + msg.toString() + '</th><th>' + destination.value + '</th></tr>';
    $('tbody').append(row);
});
