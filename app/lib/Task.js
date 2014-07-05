module.exports = Task;

function Task() {}

Task.prototype.__preinit = function() {
	this._view = null;
}

Task.prototype.init = function(cb) { cb(); }
Task.prototype.run = function() {}

//
//

Task.prototype.getView = function() { return this._view; }

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