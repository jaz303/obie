var errorContainer 	= null;

exports.preload = function() {
	
}

exports.init = function() {

	errorContainer = document.createElement('div');
	errorContainer.id = 'ob-error-report';
	errorContainer.style.display = 'none';
	document.body.appendChild(errorContainer);

	function showError(el) {
		errorContainer.appendChild(el);
		errorContainer.style.display = 'block';
	}

	process.on('uncaughtException', function(err) {

		var div = document.createElement('div');
		div.className = 'ob-error-report-item';
		
		div.innerHTML = [
			'<h2>Unhandled error</h2>',
			'<h3>' + err.message + '</h3>'
		].join("\n");

		var stack = document.createElement('pre');
		stack.textContent = err.stack;
		div.appendChild(stack);

		div.error = err;

		showError(div);

	});

}