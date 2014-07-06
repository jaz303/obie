var fs = require('fs');

module.exports = function(file) {
	var html = fs.readFileSync(file, 'utf8');
	var wrap = document.createElement('div');
	wrap.innerHTML = html;
	return wrap.childNodes[0];
}