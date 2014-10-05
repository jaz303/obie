module.exports = Task;

var kernel 	= oblib('kernel');

var du 		= require('domutil');
var terrier = require('terrier');
var fs 		= require('fs');

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

	var instance = terrier(fs.readFileSync(tpl, 'utf8'));

	this._view = instance.root;
	this._view.__task = this;

	du.addClass(this._view, 'ob-task');

	this.ui = instance;

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