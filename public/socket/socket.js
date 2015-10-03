var socket = io.connect();

socket.on('call', function(msg) {
    console.log(msg);
    var row = '<tr><th>' + msg.callId + '</th><th>' + msg.departure + '</th><th>' + msg.destination + '</th></tr>';
    $('tbody').append(row);
});
