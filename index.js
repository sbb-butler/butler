var http = require('http');
var express = require('express');
var app = express();
var tropo_webapi = require('tropo-webapi');
var server = http.createServer(app)
var bodyParser = require('body-parser')
var sbb = require('./sbb/response.js');
var io = require('socket.io');
var serveStatic = require('serve-static');


app.use(bodyParser.json());
app.use(serveStatic(__dirname + '/public'));

io = io.listen(app.listen(80));


var sessions = {};


app.post('/', function(req, res){
    console.log(req.body);

    var tropo = new TropoWebAPI();

    var say = new Say("Willkommen bei SBB! Wohin wollen Sie fahren?", null, null, null, null, "Stefan");
    var choices = new Choices("Aarau, Aarburg, Aarburg, Adliswil, Agno, Altdorf, Altstetten, Amriswil, Appenzell, Arbon, Ascona, Aubonne, Avenches, Baar, Baden, Basel, Bellinzona, Binningen, Bremgarten, Brugg, Buchs, Bulle, Bulach, Burgdorf, Cham, Chur, Coppet, Davos, Dietikon, Dubendorf, Ebikon, Eglisau, Einsiedlen, Elgg, Emmen, Erlach, Frauenfeld, Fribourg, Glarus, Gordola, Gossau, Herisau, Greifensee, Grenchen, Horgen, Horw, Huttwil, Ilanz, Ittigen, Klingnau, Kloten, Koniz, Kreuzlingen, Kriens, Kusnacht, Lenzburg, Lichtensteig, Liestal, Locarno, Lugano, Lucerne, Lyss, Maienfeld, Martigny, Meilen, Morges, Neuchatel, Nyon, Olten, Opfikon, Orbe, Payerne, Pratteln, Rapperswil, Rheinfelden, Richterswil, Romont, Rorschach, Ruti, St.Gallen, Sargans, Sarnen, Schaffhausen, Schlieren, Schwyz, Sempach, Sierre, Sion, Solothurn, Spiez, Spreitenbach, Splügen, Stafa, Sursee, Thalwil, Thun, Thusis, Untersee, Uznach, Uster, Uzwil, Vernier, Vevey, Visp, Volketswil, Wadenswil, Waldenburg, Walenstadt, Wallisellen, Wettingen, Wetzikon, Wil, Willisau, Winterthur, Wohlen, Zofingen, Zug, Zurzach, Zurich, Geneva, Basel, Lausanne, Bern, Winterthur, Lucerne, St.Gallen, Lugano, Biel, Thun, Koniz, Schaffhausen, Fribourg, Vernier, Chur, Neuchatel, Uster, Sion");

    var recognizer = "de-de";
    tropo.ask(choices, 3, null, null, "destination", recognizer, null, say, null, "Stefan");
    tropo.on("continue", null, "/destination", true);
    
    
    var callId = req.body.session.from.id;
    console.log(callId);
    var sessionId = req.body['session']['id'];
    sessions[sessionId] = {
        callId: callId
    };


    res.send(TropoJSON(tropo));
});

app.post('/destination', function(req, res){
    var tropo = new TropoWebAPI();

    console.log(req.body);
    var destination = req.body['result']['actions']['value'];
    var sessionId = req.body['result']['sessionId'];
    sessions[sessionId].destination = destination;

    tropo.say("Ihr Abfahrtsort ist " + destination, null, null, null, null, "Stefan");

    var say = new Say("Von wo fahren Sie?");
    var choices = new Choices("Aarau, Aarburg, Aarburg, Adliswil, Agno, Altdorf, Altstetten, Amriswil, Appenzell, Arbon, Ascona, Aubonne, Avenches, Baar, Baden, Basel, Bellinzona, Binningen, Bremgarten, Brugg, Buchs, Bulle, Bulach, Burgdorf, Cham, Chur, Coppet, Davos, Dietikon, Dubendorf, Ebikon, Eglisau, Einsiedlen, Elgg, Emmen, Erlach, Frauenfeld, Fribourg, Glarus, Gordola, Gossau, Herisau, Greifensee, Grenchen, Horgen, Horw, Huttwil, Ilanz, Ittigen, Klingnau, Kloten, Koniz, Kreuzlingen, Kriens, Kusnacht, Lenzburg, Lichtensteig, Liestal, Locarno, Lugano, Lucerne, Lyss, Maienfeld, Martigny, Meilen, Morges, Neuchatel, Nyon, Olten, Opfikon, Orbe, Payerne, Pratteln, Rapperswil, Rheinfelden, Richterswil, Romont, Rorschach, Ruti, St.Gallen, Sargans, Sarnen, Schaffhausen, Schlieren, Schwyz, Sempach, Sierre, Sion, Solothurn, Spiez, Spreitenbach, Splügen, Stafa, Sursee, Thalwil, Thun, Thusis, Untersee, Uznach, Uster, Uzwil, Vernier, Vevey, Visp, Volketswil, Wadenswil, Waldenburg, Walenstadt, Wallisellen, Wettingen, Wetzikon, Wil, Willisau, Winterthur, Wohlen, Zofingen, Zug, Zurzach, Zurich, Geneva, Basel, Lausanne, Bern, Winterthur, Lucerne, St.Gallen, Lugano, Biel, Thun, Koniz, Schaffhausen, Fribourg, Vernier, Chur, Neuchatel, Uster, Sion");

    var recognizer = "de-de";
    tropo.ask(choices, 3, null, null, "departure", recognizer, null, say, null, "Stefan");
    tropo.on("continue", null, "/departure", true);

    res.send(TropoJSON(tropo));
});

app.post('/departure', function(req, res){
    var tropo = new TropoWebAPI();

    console.log(req.body);
    var departure = req.body['result']['actions']['value'];
    var sessionId = req.body['result']['sessionId'];
    sessions[sessionId].departure = departure;

    var session = sessions[sessionId]

    io.emit('call', session);
    console.log(session);
    sbb(session.departure, session.destination, function(response) {
        tropo.say(response, null, null, null, null, "Stefan");
        res.send(TropoJSON(tropo));
    });
});


app.get('/', function(req, res) {
    res.sendfile('index.html');
});


//app.listen(80);
console.log('Server running on port :80');


