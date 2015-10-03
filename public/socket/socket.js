var socket = io.connect();
socket.on('destination', function(msg){
    $("ol").append($('<li>').text(msg));
});
socket.on('departure', function(msg){
    $("ol").append($('<li>').text(msg));
});