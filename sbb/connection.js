var request = require('request');
var moment = require('moment');

module.exports = function(from, to, callback) {
	request('http://transport.opendata.ch/v1/connections?limit=1&from='+from+'&to='+to, function(error, res, body) {
		var connection = JSON.parse(body);
		var time = new Date(connection.connections[0].from.departure);
		moment().utcOffset(time);
		var hour = moment(time).subtract(1,'days').format('hh');
		var minutes = moment(time).subtract(1,'days').format('mm');
        var saying = hour + " Uhr " + minutes;
		callback({from: from, platform: connection.connections[0].from.platform, departure: saying});
	});
}
