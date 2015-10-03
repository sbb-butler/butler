var http = require('http');
var express = require('express');
var app = express();
var tropo_webapi = require('tropo-webapi');
var server = http.createServer(app)
var bodyParser = require('body-parser')

app.use(bodyParser.json());

var sessions = {};


// Usage
// var response = require('./sbb/response.js');
// response("Zurich", "St.Gallen", function(response) {
// 	console.log(response);
//  -> {from: "Zurich", platform: "2"}
// });

app.post('/', function(req, res){
    var tropo = new TropoWebAPI();

    var say = new Say("Welcome to SBB! Where do you want to go?");
    var choices = new Choices("Bern, Zurich");

    tropo.ask(choices, 3, null, null, "destination", null, null, say, null, null);
    tropo.on("continue", null, "/destination", true);

    res.send(TropoJSON(tropo));
});

app.post('/destination', function(req, res){
    var tropo = new TropoWebAPI();

    console.log(req.body);
    var destination = req.body['result']['actions']['value'];
    var sessionId = req.body['result']['sessionId'];
    sessions[sessionId] = {
        destination: destination
    }

    tropo.say("Your destination is " + destination);

    var say = new Say("From where do you want to start?");
    var choices = new Choices("Bern, Zurich"); // Read all possible locations
    tropo.ask(choices, 3, null, null, "departure", null, null, say, null, null);
    tropo.on("continue", null, "/departure", true);

    console.log(destination)
    res.send(TropoJSON(tropo));
});

app.post('/departure', function(req, res){
    var tropo = new TropoWebAPI();

    console.log(req.body);
    var departure = req.body['result']['actions']['value'];
    var sessionId = req.body['result']['sessionId'];
    sessions[sessionId].departure = departure;
    tropo.say("Your departure is " + departure);
    console.log(sessions[sessionId])

    // Lookup sbb connections
    // Tell connection

    console.log(departure)
    res.send(TropoJSON(tropo));
});

app.listen(80);
console.log('Server running on port :80');
