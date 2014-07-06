module.exports = Task;

var kernel = oblib('kernel');

function Task() {}

Task.prototype.__preinit = function() {
	this._view = null;
}

Task.prototype.init = function() {}
Task.prototype.run = function() {}
Task.prototype.destroy = function() {}

Task.prototype.spawn = function(taskType) {
	return kernel.spawn(taskType, this.id);
}

//
//

Task.prototype.getView = function() {
	return this._view;
}

Task.prototype._loadViewFromTemplate = function(tpl) {
	
	this._view = obtpl(tpl);

	var ui = this.ui = {};

	function _addOne(k, el) {
		if (k.substr(-2, 2) === '[]') {
			k = k.slice(0, -2);
			if (!(k in ui))
				ui[k] = [];
			if (!Array.isArray(ui[k]))
				throw new Error("type mismatch - existing element for ui key '" + k + "' not plucked as array");
			ui[k].push(el);
		} else {
			ui[k] = el;
		}
	}

	var uiEls = this._view.querySelectorAll('[data-ui]');
	for (var i = 0; i < uiEls.length; ++i) {
		var el = uiEls[i];
		var key = el.getAttribute('data-ui');
		if (key.indexOf(' ') >= 0) {
			key.trim().split(/\s+/).forEach(function(k) {
				_addOne(k, el);
			});
		} else {
			_addOne(key, el);
		}
	}

}

//
// Template methods for visible tasks

Task.prototype.viewWillAttach = function() {}
Task.prototype.viewDidAttach = function() {}
Task.prototype.viewWillDetach = function() {}
Task.prototype.viewDidAttach = function() {}

//
// Template methods for handling lifecycle of child tasks

Task.prototype.childKilled = function(tid) {}
Task.prototype.chilDetached = function(tid) {}
Task.prototype.childAttached = function(tid) {}