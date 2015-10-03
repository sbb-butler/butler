var socket = io.connect('http://localhost', { port: 80 });
socket.on('destination', function(msg){
    console.log(msg);
    $("ol").append($('<li>').text(msg));
});
socket.on('departure', function(msg){
    $("ol").append($('<li>').text(msg));
});