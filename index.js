var http = require('http');
var express = require('express');
var app = express();
var tropo_webapi = require('tropo-webapi');
var server = http.createServer(app)
var bodyParser = require('body-parser')
var sbb = require('./sbb/connection.js');
var io = require('socket.io');
var serveStatic = require('serve-static');
var stations = require('./stations.json');

app.use(bodyParser.json());
app.use(serveStatic(__dirname + '/public'));
io = io.listen(app.listen(80));

var sessions = {};


function filterCallableStations(choix) {
    return choix.filter(function(val) {
        return val.indexOf("-") == -1 && val.indexOf("(") == -1 && val.indexOf(".") == -1 && val.indexOf("'") == -1 && val.indexOf("/") == -1 && val.indexOf("é") == -1;
    });
};

var sessions = {};

app.post('/', function(req, res){
    var tropo = new TropoWebAPI();

    var say = new Say("Willkommen bei SBB! Wohin wollen Sie fahren?", null, null, null, null, "Stefan");

    var choices = new Choices(filterCallableStations(stations.stations).join(", "));
    var recognizer = "de-de";
    tropo.ask(choices, 3, null, null, "destination", recognizer, null, say, null, "Stefan");
    tropo.on("continue", null, "/destination", true);
    tropo.on("incomplete", null, "/incomplete", true);



    var callId = req.body.session.from.id;
    var sessionId = req.body['session']['id'];
    sessions[sessionId] = {
        callId: callId
    };


    res.send(TropoJSON(tropo));
});

app.post('/destination', function(req, res){
    var tropo = new TropoWebAPI();

    if(req.body['result']['actions']) {
        var destination = req.body['result']['actions']['value'];
        var sessionId = req.body['result']['sessionId'];
        sessions[sessionId].destination = destination;

        tropo.say("Ihr Abfahrtsort ist " + destination, null, null, null, null, "Stefan");

        var say = new Say("Von wo fahren Sie?");
        var choix = stations.stations.filter(function (val) {
            return val.indexOf(" ") == -1 && val.indexOf("-") == -1 && val.indexOf("(") == -1 && val.indexOf(".") == -1;
        });
        var choices = new Choices(filterCallableStations(stations.stations).join(", "));

        var recognizer = "de-de";
        tropo.ask(choices, 3, null, null, "departure", recognizer, null, say, null, "Stefan");
        tropo.on("continue", null, "/departure", true);
        tropo.on("incomplete", null, "/incomplete", true);


        res.send(TropoJSON(tropo));
    }
});

app.post('/departure', function(req, res){
    var tropo = new TropoWebAPI();

    if(req.body['result']['actions']) {
        var departure = req.body['result']['actions']['value'];
        var sessionId = req.body['result']['sessionId'];
        sessions[sessionId].departure = departure;

        var session = sessions[sessionId];

        io.emit('call', session);

        console.log(session);

        sbb(session.departure, session.destination, function (error, response) {
            if (error) {
                tropo.say("SBB konnte ihre Anfrage nicht verarbeiten.", null, null, null, null, "Stefan");
            } else {
                var firstStation = "" + response[0];
                tropo.say(firstStation, null, null, null, null, "Stefan");
                // Twilio Credentials
                var accountSid = 'AC8e449a90cfd0453b35f680291649ad18';
                var authToken = 'cdec6c3325b55ba12e9a9973c89d828d';

                //require the Twilio module and create a REST client
                var client = require('twilio')(accountSid, authToken);
                client.messages.create({
                    to: "+" + session.callId,
                    from: "(801) 335-6779",
                    body: response.toString(),
                }, function (err, message) {

                });
            }
            res.send(TropoJSON(tropo));
        });
    }
});


app.post('/incomplete', function(req, res){
    var tropo = new TropoWebAPI();
    tropo.say("Wir konnten Sie leider nicht verstehen. Rufen Sie noch einmal ein an.", null, null, null, null, "Stefan");
    res.send(TropoJSON(tropo));
});



app.get('/', function(req, res) {
    res.sendfile('index.html');
});


//app.listen(80);
console.log('Server running on port :80');


