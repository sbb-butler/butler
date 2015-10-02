var request = require('request');

module.exports = function(from, to, callback) {
	request('http://transport.opendata.ch/v1/connections?limit=1&from='+from+'&to='+to, function(error, res, body) {
		var connection = JSON.parse(body);
		callback({from: from, platform: connection.connections[0].from.platform});
	});
}
