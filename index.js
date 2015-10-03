var http = require('http');
var express = require('express');
var app = express();
var tropo_webapi = require('tropo-webapi');
var server = http.createServer(app)
var bodyParser = require('body-parser')
var sbb = require('./sbb/connection.js');
var io = require('socket.io');
var serveStatic = require('serve-static');

app.use(bodyParser.json());
app.use(serveStatic(__dirname));

io = io.listen(app.listen(80));
var sessions = {};
var callers = {};

app.post('/', function(req, res){
    var tropo = new TropoWebAPI();

    var say = new Say("Welcome to SBB! Where do you want to go?");
    var choices = new Choices("Aarau, Aarburg, Aarburg, Adliswil, Agno, Altdorf, Altstetten, Amriswil, Appenzell, Arbon, Ascona, Aubonne, Avenches, Baar, Baden, Basel, Bellinzona, Binningen, Bremgarten, Brugg, Buchs, Bulle, Bulach, Burgdorf, Cham, Chur, Coppet, Davos, Dietikon, Dubendorf, Ebikon, Eglisau, Einsiedlen, Elgg, Emmen, Erlach, Frauenfeld, Fribourg, Glarus, Gordola, Gossau, Herisau, Greifensee, Grenchen, Horgen, Horw, Huttwil, Ilanz, Ittigen, Klingnau, Kloten, Koniz, Kreuzlingen, Kriens, Kusnacht, Lenzburg, Lichtensteig, Liestal, Locarno, Lugano, Lucerne, Lyss, Maienfeld, Martigny, Meilen, Morges, Neuchatel, Nyon, Olten, Opfikon, Orbe, Payerne, Pratteln, Rapperswil, Rheinfelden, Richterswil, Romont, Rorschach, Ruti, St.Gallen, Sargans, Sarnen, Schaffhausen, Schlieren, Schwyz, Sempach, Sierre, Sion, Solothurn, Spiez, Spreitenbach, Splügen, Stafa, Sursee, Thalwil, Thun, Thusis, Untersee, Uznach, Uster, Uzwil, Vernier, Vevey, Visp, Volketswil, Wadenswil, Waldenburg, Walenstadt, Wallisellen, Wettingen, Wetzikon, Wil, Willisau, Winterthur, Wohlen, Zofingen, Zug, Zurzach, Zurich, Geneva, Basel, Lausanne, Bern, Winterthur, Lucerne, St.Gallen, Lugano, Biel, Thun, Koniz, Schaffhausen, Fribourg, Vernier, Chur, Neuchatel, Uster, Sion");

    tropo.ask(choices, 3, null, null, "destination", null, null, say, null, null);
    tropo.on("continue", null, "/destination", true);

    res.send(TropoJSON(tropo));
});

app.post('/destination', function(req, res){
    var tropo = new TropoWebAPI();

    //console.log(req.body);
    var destination = req.body['result']['actions']['value'];
    var sessionId = req.body['result']['sessionId'];
    sessions[sessionId] = {
        destination: destination
    }

    tropo.say("Your destination is " + destination);

    var say = new Say("From where do you want to start?");
    var choices = new Choices("Aarau, Aarburg, Aarburg, Adliswil, Agno, Altdorf, Altstetten, Amriswil, Appenzell, Arbon, Ascona, Aubonne, Avenches, Baar, Baden, Basel, Bellinzona, Binningen, Bremgarten, Brugg, Buchs, Bulle, Bulach, Burgdorf, Cham, Chur, Coppet, Davos, Dietikon, Dubendorf, Ebikon, Eglisau, Einsiedlen, Elgg, Emmen, Erlach, Frauenfeld, Fribourg, Glarus, Gordola, Gossau, Herisau, Greifensee, Grenchen, Horgen, Horw, Huttwil, Ilanz, Ittigen, Klingnau, Kloten, Koniz, Kreuzlingen, Kriens, Kusnacht, Lenzburg, Lichtensteig, Liestal, Locarno, Lugano, Lucerne, Lyss, Maienfeld, Martigny, Meilen, Morges, Neuchatel, Nyon, Olten, Opfikon, Orbe, Payerne, Pratteln, Rapperswil, Rheinfelden, Richterswil, Romont, Rorschach, Ruti, St.Gallen, Sargans, Sarnen, Schaffhausen, Schlieren, Schwyz, Sempach, Sierre, Sion, Solothurn, Spiez, Spreitenbach, Splügen, Stafa, Sursee, Thalwil, Thun, Thusis, Untersee, Uznach, Uster, Uzwil, Vernier, Vevey, Visp, Volketswil, Wadenswil, Waldenburg, Walenstadt, Wallisellen, Wettingen, Wetzikon, Wil, Willisau, Winterthur, Wohlen, Zofingen, Zug, Zurzach, Zurich, Geneva, Basel, Lausanne, Bern, Winterthur, Lucerne, St.Gallen, Lugano, Biel, Thun, Koniz, Schaffhausen, Fribourg, Vernier, Chur, Neuchatel, Uster, Sion");
    tropo.ask(choices, 3, null, null, "departure", null, null, say, null, null);
    tropo.on("continue", null, "/departure", true);

    io.sockets.emit('destination', { message: destination });
    res.send(TropoJSON(tropo));
});

app.post('/departure', function(req, res){
    var tropo = new TropoWebAPI();

    //console.log(req.body);
    var departure = req.body['result']['actions']['value'];
    var sessionId = req.body['result']['sessionId'];
    sessions[sessionId].departure = departure;

    var session = sessions[sessionId];
    //console.log(session);

    io.sockets.emit('departure', { message: departure });
    //console.log(session);
    sbb(session.departure, session.destination, function(response) {
        tropo.say(""+response[0]);
        // Twilio Credentials 
        var accountSid = 'AC8e449a90cfd0453b35f680291649ad18'; 
        var authToken = 'cdec6c3325b55ba12e9a9973c89d828d'; 
         
        //require the Twilio module and create a REST client 
        var client = require('twilio')(accountSid, authToken); 
        client.messages.create({ 
            to: "+41792565800", 
            from: "(801) 335-6779", 
            body: response.toString(),
        }, function(err, message) { 
            console.log(message.sid); 
        });
        res.send(TropoJSON(tropo));
    });
});


app.get('/', function(req, res) {
    res.sendfile('index.html');
});


//app.listen(80);
console.log('Server running on port :80');


