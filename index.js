var response = require('./response.js');
response("Zurich", "St.Gallen", function(response) {
	console.log(response);
});
