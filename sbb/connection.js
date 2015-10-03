var request = require('request');
var moment = require('moment');

module.exports = function(from, to, callback) {
	request('http://transport.opendata.ch/v1/connections?limit=1&from='+from+'&to='+to, function(error, res, body) {
		var connection = JSON.parse(body);
		var sections = connection.connections[0].sections;
		var stations = [];
		var time = new Date(connection.connections[0].from.departure);
		moment().utcOffset(time);
		var departure = moment(time).subtract(1,'days').format('h:mm a');
		stations.push("Zug fährt von " + from + " auf Gleis " + connection.connections[0].from.platform + " um " + departure + " ab");
		for(var i in sections) {
			//console.log(sections[i]);
			var arrival = sections[i].arrival;
			var arrivalTime = new Date(arrival.arrival);
			moment().utcOffset(arrivalTime);
			var departureTime = moment(arrivalTime).subtract(1,'days').format('h:mm a');
			stations.push("Ankunft in "+arrival.station.name+" auf Gleis "+arrival.platform+" um "+departureTime);
		}
		callback(stations);
	});
}
