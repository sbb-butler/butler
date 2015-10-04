var request = require('request');
var moment = require('moment');
var tz = require('moment-timezone');

module.exports = function(from, to, callback) {
	request('http://transport.opendata.ch/v1/connections?limit=1&from='+from+'&to='+to, function(error, res, body) {
		if(error){
			callback(error, []);
		}else {
			var connection = JSON.parse(body);
			if (connection.connections) {
				var sections = connection.connections[0].sections;
				var stations = [];
				var time = new Date(connection.connections[0].from.departure);

                console.log(connection.connections[0].from.departure);
				moment().utcOffset(time);

				var hour = moment(time).subtract(1, 'days').format('hh');
				var minutes = moment(time).subtract(1, 'days').format('mm');
				var departure = hour + " Uhr " + minutes;

				stations.push("Der Zug fährt von " + from + " auf Gleis " + connection.connections[0].from.platform + " um " + departure + " ab");

				for (var i in sections) {
					var arrival = sections[i].arrival;
                    var arriveAt = moment(arrival.arrival).tz("Europe/Zurich");
                    var arrivalTimeSpeech = arriveAt.format('hh') + " Uhr " + arriveAt.format('mm');

					stations.push("Ankunft in " + arrival.station.name + " auf Gleis " + arrival.platform + " um " + arrivalTimeSpeech);


				}
                callback(error, stations, sections);
			} else {
				callback(new Error("No connections found."),[]);
			}
		}
	});
}
