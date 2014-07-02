module.exports = defineTask;

var Task        = require('./Task');
var TaskBuilder = require('./TaskBuilder');
var registry    = require('./task_registry');

function defineTask(id, cb) {

    var ctor = function() { this.__preinit(); };
    ctor.prototype = Object.create(Task.prototype);

    var meta = {
        id      : id,
        name    : id,
        hidden  : false
    };

    var builder = new TaskBuilder(meta, ctor.prototype);
    cb(builder);
    builder.__compile__();

    meta.create = function() { return new ctor(); }

    registry.register(meta);

    return meta;

}
