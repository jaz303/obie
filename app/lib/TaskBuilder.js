module.exports = TaskBuilder;

function TaskBuilder(meta, proto) {
	this._meta = meta;
	this._proto = proto;
}

TaskBuilder.prototype.name = function(name) {
	this._meta.name = name;
}

TaskBuilder.prototype.init = function(fun) {
	this._proto.init = fun;
}

TaskBuilder.prototype.message = function(name, opts, handler) {
	this._proto[name] = handler;
	// TODO: extract opts and stash metdata somewhere
}

TaskBuilder.prototype.method = function(name, fun) {
	this._proto[name] = fun;
}

TaskBuilder.prototype.__compile__ = function() {
	// no-op for now
}