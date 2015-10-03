module.exports = function(from, to, callback) {
	var connection = require('./connection.js');
	connection(from, to, function(gleis) {
		var platform = gleis.platform;
		var text = "Train departs from " + from + " on platform " + platform;
		callback(text);
	});
}
