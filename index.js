var http = require('http');
var express = require('express');
var app = express();
var tropo_webapi = require('tropo-webapi');
var server = http.createServer(app)
var bodyParser = require('body-parser')
var sbb = require('./sbb/connection.js');
var io = require('socket.io');
var serveStatic = require('serve-static');
var stationData = require('./stations.json');

var port = process.env.VCAP_APP_PORT || 3000;

var languages = {
    german: {
        voice: "Stefan",
        recognizer: "de-de",
        arrivalReached: "Sie sind angekommen.",
        whereToGo: "Wohin wollen Sie reisen?",
        whereToDepart: "Von wo starten sie?",
        couldNotHandleRequest: "SBB konnte ihre Anfrage nicht verarbeiten.",
        couldNotUnderstand: "Wir konnten Sie leider nicht verstehen. Rufen Sie noch einmal ein an.",
        destinationIs: function(destination) {
            return "Ihr Ziel ist " + destination;
        },
        nextSectionIs: function(section) {
            return "Du erreichst " + section.arrival.station.name;
        }
    },
    french: {
        voice: "Florence",
        recognizer: "fr-fr",
        arrivalReached: "Vous êtes arrivé.",
        whereToGo: "Quelle destination?",
        whereToDepart: "Quelle début?",
        couldNotHandleRequest: "C'est pas possible de traiter votre demande.",
        couldNotUnderstand: "Nous ne pouvions pas les comprendre, malheureusement, S'il vous plaît appelons tard.",
        destinationIs: function(destination) {
            return "Votre objective est " + destination;
        },
        nextSectionIs: function(section) {
            return "Tu est a " + section.arrival.station.name;
        }
    },
    english: {
        voice: "Veronica",
        recognizer: "en-us",
        arrivalReached: "You arrived.",
        whereToGo: "Where do you want to go?",
        whereToDepart: "From where do you start?",
        couldNotHandleRequest: "SBB could not handle your request.",
        couldNotUnderstand: "Cannot understand you. Please call again.",
        destinationIs: function(destination) {
            return "Your destination is " + destination;
        },
        nextSectionIs: function(section) {
            return "Next section is" + section.arrival.station.name;
        }
    }
}

app.use(bodyParser.json());
app.use(serveStatic(__dirname + '/public'));
io = io.listen(app.listen(port));

// Stateful session store
var sessions = {};

// Some stations cannot be parsed into a grammar so they need to be filtered out
function allowStationsByGrammar(choices) {
    return choices.filter(function(val) {
        return val.indexOf("-") == -1
            && val.indexOf("(") == -1
            && val.indexOf(".") == -1
            && val.indexOf("'") == -1
            && val.indexOf("/") == -1
            && val.indexOf("é") == -1;
    });
}

function createStationsGrammar(language) {
    var goodStations = allowStationsByGrammar(stationData.stations);
    return goodStations.join(", ");
}

function askLanguage(tropo) {
    tropo.say("Guten Tag, herzlich willkommen bei ihrer SBB Auskunft!", null, null, null, null, languages.german.voice);

    var choices = new Choices("1,2,3");
    var say = new Say("Für Deutsch drücken Sie die Eins");
    tropo.ask(choices, null, null, null, "digit", null, null, say, 60, languages.german.voice);
    tropo.say("Pour français touche deux", null, null, null, null, languages.french.voice);
    tropo.say("For English press three", null, null, null, null, languages.english.voice);

    return tropo;
}

function previousCall(callId) {
    for(var key in sessions) {
        if(sessions[key].callId === callId && sessions[key].completed === true) {
            return sessions[key];
        }
    }
    return false;
}

app.post('/', function(req, res){
    var callId = req.body.session.from.id;
    var sessionId = req.body.session.id;

    var previous = previousCall(callId);
    console.log(previous);

    if(previous) {
        var session = previous;
        var language = session.language;
        var destination = session.destination;
        var tropo = new TropoWebAPI();

        if(session.sections && session.sections.length > 0) {
            var nextSection = session.sections.pop();
            console.log(nextSection);
            // Here we could build to respond to the destination
            tropo.say(language.nextSectionIs(nextSection), null, null, null, null, language.voice);
        } else {
            tropo.say(language.arrivalReached, null, null, null, null, language.voice);
        }

    } else {
        var tropo = askLanguage(new TropoWebAPI());
        tropo.on("continue", null, "/askDestination", true);
    }

    sessions[sessionId] = {
        callId: callId,
        completed: false
    };

    res.send(TropoJSON(tropo));
});

function languageFromNumber(chosenNumber) {
    var language = languages.german;
    if(chosenNumber === "1") {
        language = languages.german;
    } else if (chosenNumber === "2") {
        language = languages.french;
    } else if (chosenNumber === "3") {
        language = languages.english;
    }
    return language;
}

app.post('/askDestination', function(req, res){
    var tropo = new TropoWebAPI();

    if(req.body.result.actions) {
        var chosenNumber = req.body.result.actions.value;
        var sessionId = req.body.result.sessionId;
        var language = languageFromNumber(chosenNumber);

        sessions[sessionId].language = language;
        var say = new Say(language.whereToGo, null, null, null, null, language.voice);
        var choices = new Choices(createStationsGrammar(language));
        tropo.ask(choices, 3, null, null, "destination", language.recognizer, null, say, null, language.voice);

        tropo.on("continue", null, "/destination", true);
        tropo.on("incomplete", null, "/incomplete", true);

        res.send(TropoJSON(tropo));
    }
});

app.post('/destination', function(req, res){
    var tropo = new TropoWebAPI();

    if(req.body['result']['actions']) {
        var destination = req.body['result']['actions']['value'];
        var sessionId = req.body['result']['sessionId'];
        sessions[sessionId].destination = destination;
        var language = sessions[sessionId].language;

        tropo.say(language.destinationIs(destination), null, null, null, null, language.voice);

        var say = new Say(language.whereToDepart);
        var choices = new Choices(createStationsGrammar());
        tropo.ask(choices, 3, null, null, "departure", language.recognizer, null, say, null, language.voice);

        tropo.on("continue", null, "/departure", true);
        tropo.on("incomplete", null, "/incomplete", true);

        res.send(TropoJSON(tropo));
    }
});

app.post('/departure', function(req, res){
    var tropo = new TropoWebAPI();

    if(req.body['result']['actions']) {
        var departure = req.body.result.actions.value;
        var sessionId = req.body.result.sessionId;
        sessions[sessionId].departure = departure;

        var session = sessions[sessionId];
        var language = session.language;

        io.emit('call', session);

        console.log(session);

        sbb(session.departure, session.destination, function (error, stations, sections) {
            if (error || stations.length == 0) {
                tropo.say(language.couldNotHandleRequest, null, null, null, null, language.voice);
            } else {
                var firstStation = "" + stations[0];
                tropo.say(firstStation, null, null, null, null, language.voice);

                tropo.call(session.callId, null, null, null, null, null, "SMS", null, null, null);
                tropo.say(stations.toString());

                // Twilio Credentials
                var accountSid = 'AC8e449a90cfd0453b35f680291649ad18';
                var authToken = 'cdec6c3325b55ba12e9a9973c89d828d';

                session.completed = true;
                sessions[sessionId].sections = sections;

                //require the Twilio module and create a REST client
                var client = require('twilio')(accountSid, authToken);
                client.messages.create({
                    to: "+" + session.callId,
                    from: "(801) 335-6779",
                    body: stations.toString(),
                }, function (err, message) {

                });
            }
            res.send(TropoJSON(tropo));
        });
    }
});


app.post('/incomplete', function(req, res) {
    var tropo = new TropoWebAPI();
    tropo.say("Wir konnten Sie leider nicht verstehen. Rufen Sie noch einmal ein an.", null, null, null, null, "Stefan");
    res.send(TropoJSON(tropo));
});

console.log('Server running on port :' + port);
