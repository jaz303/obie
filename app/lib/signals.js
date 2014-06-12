var signal = require('signalkit');

exports.register = function(signalName) {
	
	if (signalName === "register") {
		throw new Error("invalid signal name");
	}

	exports[signalName] = signal(signalName);

}