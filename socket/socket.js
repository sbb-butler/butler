var socket = io.connect('http://localhost', { port: 80 });
socket.on('destination', function(msg){
    console.log(msg);
});
socket.on('departure', function(msg){
    console.log(msg);
});