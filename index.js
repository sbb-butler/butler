var http = require('http');
var express = require('express');
var app = express();
var tropo_webapi = require('tropo-webapi');
var server = http.createServer(app)
var bodyParser = require('body-parser')

// Required to process the HTTP body.
// req.body has the Object while req.rawBody has the JSON string.

app.use(bodyParser.json());

app.post('/', function(req, res){

    var tropo = new TropoWebAPI();

    var say = new Say("What's your favorite color?  Choose from red, blue or green.");
    var choices = new Choices("red, blue, green");

    // (choices, attempts, bargein, minConfidence, name, recognizer, required, say, timeout, voice);

    tropo.ask(choices, 3, null, null, "color", null, null, say, null, null);

    tropo.on("continue", null, "/continue", true);

    res.send(TropoJSON(tropo));

});

app.post('/continue', function(req, res){

    var tropo = new TropoWebAPI();

    var answer = req.body['result']['actions']['value'];

    tropo.say("You said " + answer);

    console.log(answer)
    res.send(TropoJSON(tropo));

});

app.listen(80);
console.log('Server running on port :80');

