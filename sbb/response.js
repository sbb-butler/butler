module.exports = function(from, to, callback) {
	var connection = require('./connection.js');
	connection(from, to, function(gleis) {
		var platform = gleis.platform;
		var text = "Der Zug fährt in " + from + " auf Gleis" + platform;
		callback(text);
	});
}
