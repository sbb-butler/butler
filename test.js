var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app)
var bodyParser = require('body-parser')
var sbb = require('./sbb/connection.js');
var io = require('socket.io');
var serveStatic = require('serve-static');
var stations = require('./stations.json');

var port = process.env.VCAP_APP_PORT || 3000;

app.use(bodyParser.json());
app.use(serveStatic(__dirname + '/public'));
io = io.listen(app.listen(port));

// Stateful session store
var sessions = {};



sbb('Zurich', 'Basel', function (error, response) {
        if (error || response.length == 0) {
           console.log(error);
	} else {
	   for (var i = 0; i < response.length; i++) {
	      if(!response[i].walk) {
	        console.log('station ' + i);
	        console.log(response[i].departure.station.name);
		console.log(response[i].arrival.station.name);
                console.log(response[i].departure.departure + ' ' + response[i].arrival.arrival);
		console.log('----------------------------');
	      }
	   }
        }
    });


console.log('Server running on port :' + port);


