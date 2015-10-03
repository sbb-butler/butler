module.exports = function(from, to, callback) {
	var connection = require('./connection.js');
	connection(from, to, function(gleis) {
		var platform = gleis.platform;
		var departure = gleis.departure;
		var text = "Zug fährt von " + from + " auf Gleis " + platform + " um " + departure;
		callback(text);
	});
}
